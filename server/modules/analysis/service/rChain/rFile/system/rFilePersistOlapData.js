import * as fs from 'fs'
import * as path from 'path'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as StringUtils from '@core/stringUtils'

import * as FileUtils from '@server/utils/file/fileUtils'
import * as ProcessingChain from '@common/analysis/chain'

/**
 * Persists OLAP data to a CSV file.
 *
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey.
 * @param {object} params.chain - The processing chain.
 * @param {Array} params.data - The OLAP data to persist.
 * @param {string} params.outputDir - The output directory.
 * @param {string} [params.fileName=null] - Optional file name. If not provided, a default name will be generated.
 *
 * @returns {Promise<string>} - The path to the created CSV file.
 */
export const persistOlapData = async ({ survey, chain, data, outputDir, fileName = null }) => {
  if (R.isEmpty(data)) {
    return null
  }

  // Create output directory if it doesn't exist
  await FileUtils.mkdir(outputDir)

  // Generate file name if not provided
  const fileNameToUse =
    fileName ||
    `olap_data_${Survey.getName(survey)}_${ProcessingChain.getLabel(chain, Survey.getDefaultLanguage(survey))}_${StringUtils.formatDateISO(new Date())}.csv`

  // Sanitize file name
  const sanitizedFileName = fileNameToUse.replace(/[^a-z0-9_\-\.]/gi, '_')

  // Full path to the CSV file
  const filePath = path.join(outputDir, sanitizedFileName)

  // Get headers from the first row
  const headers = Object.keys(data[0])

  // Create CSV content
  const csvContent = [
    // Headers row
    headers.join(','),
    // Data rows
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          // Handle values that might contain commas or quotes
          if (value === null || value === undefined) return ''
          const valueStr = String(value)
          if (valueStr.includes(',') || valueStr.includes('"') || valueStr.includes('\n')) {
            return `"${valueStr.replace(/"/g, '""')}"`
          }
          return valueStr
        })
        .join(',')
    ),
  ].join('\n')

  // Write to file
  await fs.promises.writeFile(filePath, csvContent, 'utf8')

  return filePath
}
