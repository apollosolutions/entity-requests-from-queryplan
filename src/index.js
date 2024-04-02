import { parse } from "graphql";
import { Command, Option } from "clipanion";
import { parseEntityCalls } from "./parse-entity-calls-from-qp.js";
import { QueryPlanner } from "@apollo/query-planner";
import { getValidSupergraph } from "./get-valid-supergraph.js";
import { writeFileSync, readdirSync, readFileSync } from "fs";
import * as t from "typanion";
import { operationFromDocument } from "@apollo/federation-internals";

export class MainCommand extends Command {
  static paths = [Command.Default];
  operations = Option.String("--operations", { required: true });
  graphref = Option.String("--graphref", { required: false });
  supergraph = Option.String("--supergraph", { required: false });
  out = Option.String("--out", { required: false, validator: t.isString() });

  async execute() {
    let outFilename = this.out;
    let supergraphInput = this.supergraph;
    let graphref = this.graphref
      ? this.graphref
      : process.env.APOLLO_GRAPH_REF
        ? process.env.APOLLO_GRAPH_REF
        : null;

    if ((!supergraphInput && !graphref) || (supergraphInput && this.graphref)) {
      console.error("invalid request: set either --supergraph or --graphref");
      process.exit(1);
    }

    const supergraph = await getValidSupergraph(supergraphInput, graphref);
    const result = await processOperations(supergraph, this.operations);

    saveOutputToFile(result, outFilename);
    this.context.stdout.write("Complete!\n");
  }
}

const saveOutputToFile = (output, out) => {
  let outFilename = out;
  if (!outFilename) {
    let now = new Date().toISOString().replace(/:/g, "-");
    outFilename = `entity-ops-${now}`;
  }
  const outputString = JSON.stringify(output, null, 2);
  writeFileSync(`${outFilename}.json`, outputString, "utf-8");
}

const processOperations = async (supergraph, operationsPath) => {
  const queryPlanner = new QueryPlanner(supergraph);
  const operationFiles = readdirSync(operationsPath);

  const parsedOperations = [];

  for (const file of operationFiles) {
    const filePath = `${operationsPath}/${file}`;
    let fileContent;
    let document;

    try {
      fileContent = readFileSync(filePath, "utf-8");
      document = parse(fileContent);
    } catch (err) {
      console.error(`Error reading file: ${err.message}`);
      continue;
    }

    if (!document || document.definitions.length === 0) {
      continue;
    }

    for (const definition of document.definitions) {
      if (definition.kind === "OperationDefinition") {
        const operationName = definition.name?.value ?? "";
        const op = operationFromDocument(supergraph.schema, document, { operationName });
        const queryPlan = queryPlanner.buildQueryPlan(op);
        const entityRequests = parseEntityCalls(queryPlan);

        parsedOperations.push({
          operationName,
          originalOperation: op.toString(),
          entityRequests,
          queryPlan,
        });
      }
    }
  }

  return {
    operations: parsedOperations,
  };
}