import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import type { Plugin, RollupOptions } from 'rollup'
import ts from 'rollup-plugin-ts'

const config: RollupOptions = {
  input: ['src/index.ts', 'src/bin/run-cli.ts'],
  output: [
    {
      dir: 'dist',
      format: 'cjs',
      entryFileNames: '[name].js',
      exports: 'named',
      preserveModules: true,
      sourcemap: true,
    },
    {
      dir: 'dist',
      format: 'es',
      exports: 'named',
      entryFileNames: '[name].mjs',
      preserveModules: true,
      sourcemap: true,
    },
  ],
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
  },
  external: [/node_modules/],
  plugins: [
    ts({
      tsconfig: 'tsconfig.build.json',
    }),
    nodeResolve(),
    commonjs(),
    json(),
  ],
}

export default config
