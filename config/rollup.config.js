import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import pkg from '../package.json';
import commonjs from 'rollup-plugin-commonjs';

// https://github.com/a-tarasyuk/rollup-typescript-babel/blob/master/rollup.config.js
const extensions = [
    '.js', '.jsx', '.ts', '.tsx',
];
const input = './.src/index.js';
// Specify here external modules which you don't want to include in your bundle (for instance: 'lodash', 'moment' etc.)
// https://rollupjs.org/guide/en#external-e-external
const external = [];
const babelOptions = {
        exclude: 'node_modules/**',
        extensions,
        babelrc: false,
        presets: [['@babel/preset-env', {
            'useBuiltIns': 'usage',
            'corejs': '3.0.0',
        }], '@babel/preset-react', '@babel/preset-typescript'],
        plugins: [
            '@babel/plugin-proposal-export-default-from',
            '@babel/plugin-proposal-export-namespace-from',
            '@babel/plugin-syntax-bigint']
};
const plugins = [
    resolve({ extensions }),
    commonjs(),
    babel(babelOptions)
];
const ECMAScriptModules = {
    file: pkg.main,
    format: 'es',
};
const commonJS = {
    file: pkg.cjs,
    format: 'cjs',
};
const browserIIFE = {
    file: pkg.browser,
    format: 'iife',
    name:'asyncItertools',
    // https://rollupjs.org/guide/en#output-globals-g-globals
    globals: {},
};
const output = [commonJS, ECMAScriptModules, browserIIFE];
export default {
  input,
  external,
  plugins,
  output,
};