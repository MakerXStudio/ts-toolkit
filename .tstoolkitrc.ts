import {TsToolkitConfig} from "./src";

const config: TsToolkitConfig = {
  packageConfig: {
    srcDir: 'src',
    outDir: 'dist',
    moduleType: 'module',
    main: 'index.ts',
    bin: {
      '@makerx/ts-toolkit': 'bin/run-cli.ts',
      tstk: 'bin/run-cli.ts',
    }
  }
}
export default config
