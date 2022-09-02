import { jsdocMd } from "jsdoc-md";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
const dirName = dirname(fileURLToPath(import.meta.url));
// https://stackoverflow.com/questions/3133243/how-do-i-get-the-path-to-the-current-script-with-node-js

jsdocMd({
  sourceGlob: "./src/**/*.js",
  markdownPath: "./src/docs/preamble.md",
  targetHeading: "API",
});
