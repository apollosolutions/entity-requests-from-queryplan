import { parse } from "graphql";
import { Command, Option } from "clipanion";
import { parseEntityCalls } from "./parse-entity-calls-from-qp.js";
import { QueryPlanner } from "@apollo/query-planner";
import { getValidSupergraph } from "./get-valid-supergraph.js";
import { writeFileSync, readdirSync, readFileSync } from "fs";
import * as t from "typanion";
import {

  operationFromDocument,
} from "@apollo/federation-internals";


export class MainCommand extends Command {
  static paths = [Command.Default];
  graphref = Option.String("--graphref", { required: false });
  supergraph = Option.String("--supergraph", { required: false });
  operations = Option.String("--operations", { required: true });
  out = Option.String("--out", { required: false, validator: t.isString() });

  async execute() {
    let supergraphInput = this.supergraph;
    let graphref = this.graphref 
      ? this.graphref 
      : process.env.APOLLO_GRAPH_REF 
        ? process.env.APOLLO_GRAPH_REF 
        : null;

    if ((!supergraphInput && !graphref) || (supergraphInput && graphref)) {
      this.context.stderr.write(
        "invalid request: set either --supergraph or --graphref"
      );
      process.exit(1);
    }

    const supergraph = await getValidSupergraph(supergraphInput, graphref);
    const queryPlanner = new QueryPlanner(supergraph);
    const operationFiles = readdirSync(this.operations);

    const parsedOperations = [];

    for (const file of operationFiles) {
      const filePath = `${this.operations}/${file}`;
      let fileContent;
      let document;

      try {
        fileContent = readFileSync(filePath, "utf-8");
        document = parse(fileContent);
      } catch(err) {
        this.context.stderr.write(`Error reading file: ${err.message}`);
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

    const result = {
      operations: parsedOperations,
    };

    if (!this.out) {
      let now = new Date().toISOString().replace(/:/g, "-");
      this.out = `entity-ops-${now}`;
    }

    this.out = `output/${this.out}.json`;
    const output = JSON.stringify(result, null, 2);
    writeFileSync(this.out, output, "utf-8");
    this.context.stdout.write("Complete!\n");
  }
}

