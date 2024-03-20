import { parse } from "graphql";
import { Supergraph } from "@apollo/federation-internals";
import { Command, Option, runExit, } from "clipanion";
import { parseEntityCalls } from "./parse-entity-calls-from-qp.js";
import { QueryPlanner } from "@apollo/query-planner";
import { validateSupergraphInput } from "./validate-supergraph-input.js";
import { writeFileSync } from "fs";
import * as t from "typanion";

import {
  operationFromDocument,
} from "@apollo/federation-internals";

import { readFileSync } from "fs";

runExit(
  class MainCommand extends Command {
    static paths = [Command.Default];

    graphref = Option.String("--graphref", { required: false });
    supergraph = Option.String("--supergraph", { required: false });
    operation = Option.String("--operation", { required: true });
    out = Option.String("--out", { required: false, validator: t.isString()});

    async execute() {
      let supergraphInput = this.supergraph
      let graphref = this.graphref

      if (!supergraphInput && !graphref) {
        throw new Error("Please provide a supergraph or graphref");
      }

      const supergraph = await validateSupergraphInput(supergraphInput, graphref);
      const queryPlanner = new QueryPlanner(supergraph);
      const op = operationFromDocument(supergraph.schema, parse(readFileSync(this.operation, "utf-8")));
      const queryPlan = queryPlanner.buildQueryPlan(op);
      const entityRequests = parseEntityCalls(queryPlan);

      const result = {
        entityRequests,
        originalOperation: op.toString(),
        queryPlan
      }

      if (!this.out){
        let now = new Date().toISOString().replace(/:/g, "-");
        this.out = `entity-ops-${now}`
      }

      this.out = `output/${this.out}.json`
      const output = JSON.stringify(result, null, 2);
      writeFileSync(this.out, output, "utf-8");
      this.context.stdout.write("Complete!\n");
    }
  }
);
