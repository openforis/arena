/* eslint-disable no-console -- this file's entire purpose is CLI output */
import fs from 'node:fs'

import { buildSampleSurveyZipBuffer } from './lib/sampleSurveyZip.ts'
import { resolveValidatedOutputPath } from './lib/outputPath.ts'

const DEFAULT_OUTPUT_PATH = './sample-survey.zip'

/**
 * CLI entry point: builds the minimal sample Arena survey zip and writes it to the path given as
 * the first CLI argument (or DEFAULT_OUTPUT_PATH when none is given).
 * @returns Resolves once the file has been written.
 */
export const main = async (): Promise<void> => {
  const outputPath = resolveValidatedOutputPath(process.argv[2] || DEFAULT_OUTPUT_PATH)
  fs.writeFileSync(outputPath, buildSampleSurveyZipBuffer())
  console.log(`Sample survey zip written to ${outputPath}`)
}

if (import.meta.main) {
  main().catch((error) => {
    console.error('Failed to build sample survey zip:', error)
    process.exitCode = 1
  })
}
