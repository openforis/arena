/* eslint-disable no-console -- this file's entire purpose is CLI output */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { buildSampleSurveyZipBuffer } from './lib/sampleSurveyZip.ts'
import { resolveValidatedOutputPath, isWithinAllowedRoot } from './lib/outputPath.ts'

const DEFAULT_OUTPUT_PATH = './sample-survey.zip'

/**
 * CLI entry point: builds the minimal sample Arena survey zip and writes it to the path given as
 * the first CLI argument (or DEFAULT_OUTPUT_PATH when none is given).
 *
 * `outputPath` is already validated by resolveValidatedOutputPath (test/load/lib/outputPath.ts,
 * covered by its own unit tests). The guard below re-checks it, inline, in this same function,
 * immediately before the write: a cross-file static-analysis path-injection scan (SonarCloud) does
 * not trace validation performed inside an imported function, so from this file's local view a
 * write using CLI-controlled data with no visible guard reads as unvalidated. This guard is what
 * that scan needs to see; it is not expected to ever actually trip in normal operation.
 * @returns Resolves once the file has been written.
 */
export const main = async (): Promise<void> => {
  const outputPath = resolveValidatedOutputPath(process.argv[2] || DEFAULT_OUTPUT_PATH)
  const allowedRoots = [process.cwd(), fs.realpathSync(os.tmpdir())].map((root) => path.resolve(root))
  if (!allowedRoots.some((root) => isWithinAllowedRoot(outputPath, root))) {
    throw new Error(`Refusing to write outside the current directory or the OS temp directory: ${outputPath}`)
  }
  fs.writeFileSync(outputPath, buildSampleSurveyZipBuffer())
  console.log(`Sample survey zip written to ${outputPath}`)
}

if (import.meta.main) {
  main().catch((error) => {
    console.error('Failed to build sample survey zip:', error)
    process.exitCode = 1
  })
}
