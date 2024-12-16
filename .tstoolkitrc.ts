import { TsToolkitConfig } from './src'

const config: TsToolkitConfig = {
  packageConfig: {
    srcDir: 'src',
    outDir: 'dist',
    moduleType: 'commonjs',
    main: 'index.ts',
    bin: {
      'ts-toolkit': 'bin/run-cli.ts',
      tstk: 'bin/run-cli.ts',
    },
  },
}
export default config
