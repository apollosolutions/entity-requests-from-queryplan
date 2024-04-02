import { Command, Option } from "clipanion";
import { getValidSupergraph } from "./get-valid-supergraph.js";
import { writeFileSync } from "fs";
import * as t from "typanion";
import { processOperations } from "./process-operations.js";

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
