import jsdocMd from 'jsdoc-md';
import { copyFileSync } from 'fs';
import {join, dirname} from 'path';
import { fileURLToPath } from 'url';
const dirName = dirname(fileURLToPath(import.meta.url));
// https://stackoverflow.com/questions/3133243/how-do-i-get-the-path-to-the-current-script-with-node-js
copyFileSync(join(dirName,'../src/docs/preamble.md' ),'./.src/preamble.md');

jsdocMd.jsdocMd({
  sourceGlob: './.src/**/*.js',
  markdownPath: './.src/preamble.md',
  targetHeading: 'API'
});
