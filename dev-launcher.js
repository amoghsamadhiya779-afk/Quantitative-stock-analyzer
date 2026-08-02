// Bypasses two Windows issues with this repo's path containing "&":
// 1. npm/next's .cmd shims fail to resolve their own directory (%~dp0 breaks on `&`).
// 2. Tailwind resolves `content` globs relative to process.cwd(), so `next` must
//    actually be run from inside frontend/, not just given "frontend" as an argument.
process.chdir(require("path").join(__dirname, "frontend"));
require("./frontend/node_modules/next/dist/bin/next");
