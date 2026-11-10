import path from 'node:path'

import * as StringUtils from '@core/stringUtils'

// labels differing only in characters dropped from the name would otherwise share the same folder
const chainUuidPartLength = 8

/**
 * Builds the R project folder name of a chain: its label reduced to lowercase letters, digits and underscores,
 * followed by the first characters of its uuid.
 * @param params - The parameters.
 * @param params.chainLabel - The chain label in the survey default language.
 * @param params.chainUuid - The chain uuid.
 * @returns The folder name.
 */
export const getChainDirName = ({
  chainLabel,
  chainUuid,
}: {
  chainLabel?: string | null
  chainUuid: string
}): string => {
  const labelPart = StringUtils.normalizeName(typeof chainLabel === 'string' ? chainLabel : '')
    .split('_')
    .filter(Boolean)
    .join('_')
  const uuidPart = chainUuid.slice(0, chainUuidPartLength)
  return labelPart ? `${labelPart}_${uuidPart}` : uuidPart
}

/**
 * Checks whether a path is strictly inside a folder (the folder itself excluded).
 * @param params - The parameters.
 * @param params.dir - The folder path.
 * @param params.filePath - The path to check.
 * @returns True if the path is inside the folder, false otherwise.
 */
export const isPathInsideDir = ({ dir, filePath }: { dir: string; filePath: string }): boolean => {
  const relativePath = path.relative(path.resolve(dir), path.resolve(filePath))
  return (
    relativePath !== '' &&
    relativePath !== '..' &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  )
}

/**
 * Returns the absolute path of the R project folder of a chain, inside the analysis output folder.
 * The folder is deleted and recreated on every script generation, so it must never be outside the output folder.
 * @param params - The parameters.
 * @param params.outputDir - The analysis output folder (ANALYSIS_OUTPUT_DIR).
 * @param params.surveyName - The survey name.
 * @param params.chainLabel - The chain label in the survey default language.
 * @param params.chainUuid - The chain uuid.
 * @returns The folder path.
 */
export const getChainDirPath = ({
  outputDir,
  surveyName,
  chainLabel,
  chainUuid,
}: {
  outputDir?: string
  surveyName: string
  chainLabel?: string | null
  chainUuid: string
}): string => {
  if (!StringUtils.isNotBlank(outputDir)) {
    throw new Error('ANALYSIS_OUTPUT_DIR environment variable not set')
  }
  const dirPath = path.resolve(outputDir, surveyName, getChainDirName({ chainLabel, chainUuid }))
  if (!isPathInsideDir({ dir: outputDir, filePath: dirPath })) {
    throw new Error('R project folder must be inside the analysis output folder')
  }
  return dirPath
}
