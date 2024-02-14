export enum ExistingFileBehaviour {
  WriteSample = 'sample',
  Skip = 'skip',
  Overwrite = 'overwrite',
}

export enum InitPlatform {
  Node = 'node',
  Other = 'other',
}

export interface InitOptions {
  existingFileBehaviour: ExistingFileBehaviour
  workingDirectory: string
  noScripts?: boolean
  noInstall: boolean
  platform?: InitPlatform
  includeCi?: boolean
}
