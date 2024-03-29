#!/usr/bin/env node

import { Builtins, Cli } from "clipanion";
import { MainCommand } from "../src/index.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const [_, __, ...args] = process.argv;

const cli = new Cli({
  binaryLabel: `entity-requests-from-queryplan`,
  binaryName: `@apollosolutions/entity-requests-from-queryplan`,
  binaryVersion: pkg.version,
});

cli.register(Builtins.HelpCommand);
cli.register(Builtins.VersionCommand);
cli.register(MainCommand);
cli.runExit(args);
