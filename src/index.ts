#!/usr/bin/env node

// Entry point for both `npx @tellet/create` and `tellet <command>`
// Delegates to cli.ts which handles routing.

import { run } from "./cli.js";

const args = process.argv.slice(2);
run(args).catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
