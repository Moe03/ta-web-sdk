const resolve = require('@rollup/plugin-node-resolve').default;
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');
const peerDepsExternal = require('rollup-plugin-peer-deps-external');
const dts = require('rollup-plugin-dts').default;

module.exports = [
  // =========================================================
  // 1) JS Build (tree-shaken)
  // =========================================================
  {
    input: 'src/index.ts', // your library entry point
    output: [
      {
        file: 'dist/index.cjs.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    // Helps ensure we only include code that is actually imported
    // from src/index.ts
    treeshake: true,
    plugins: [
      // Mark peer deps as external so they're not bundled
      peerDepsExternal(),
      // So Rollup can find and bundle 3rd party modules in node_modules
      resolve({ extensions: ['.ts', '.js'] }),
      // Convert CommonJS modules to ES6
      commonjs(),
      // This respects our tsconfig.json
      typescript({
        tsconfig: './tsconfig.json'
      })
    ]
  },

  // =========================================================
  // 2) Single (or consolidated) .d.ts Build
  // =========================================================
  {
    // Point to the root .d.ts file TSC generated for your entry.
    // Typically TSC will put it in dist/types/src/index.d.ts, but YMMV.
    // Just make sure it references everything you actually export from index.ts
    input: 'dist/src/public_packages/web-call/src/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [
      // This plugin will roll up all the .d.ts references
      // from your entire codebase into a single type bundle.
      dts()
    ]
  }
];
