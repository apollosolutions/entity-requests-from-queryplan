import { parse } from "graphql";
import { parseEntityCalls } from "./parse-entity-calls-from-qp.js";
import { QueryPlanner } from "@apollo/query-planner";
import { readdirSync, readFileSync } from "fs";
import { operationFromDocument } from "@apollo/federation-internals";


export const processOperations = async (supergraph, operationsPath) => {
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