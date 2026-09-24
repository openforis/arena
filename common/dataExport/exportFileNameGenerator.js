import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import { RecordCycle } from '@core/record/recordCycle'
import * as DateUtils from '@core/dateUtils'
import { getExtensionByFileFormat } from '@core/fileFormats'

/**
 * Returns true when the character is allowed in a sanitized filename part.
 * Allowed: letters, digits, `.`, `_`, `-`.
 * @param {string} char - Single character to check.
 * @returns {boolean} Whether the character may appear in the sanitized part.
 */
const isAllowedFileNameChar = (char) => {
  const code = char.charCodeAt(0)
  return (
    (code >= 48 && code <= 57) || // 0-9
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) || // a-z
    char === '.' ||
    char === '_' ||
    char === '-'
  )
}

/**
 * Sanitizes a filename part for download Content-Disposition headers.
 * Replaces whitespace and special characters with hyphens so names stay
 * human-readable and free of URL-encoded sequences (e.g. %20).
 * Implemented as a linear scan (no regex) to avoid super-linear backtracking.
 * @param {string|null|undefined} value - Raw filename part.
 * @returns {string} Sanitized part, or empty string if nothing usable remains.
 */
const sanitizeFileNamePart = (value) => {
  if (value == null) {
    return ''
  }
  const trimmed = String(value).trim()
  let result = ''
  let lastWasHyphen = false

  for (let i = 0; i < trimmed.length; i += 1) {
    const char = trimmed[i]
    if (isAllowedFileNameChar(char)) {
      if (char === '-') {
        if (!lastWasHyphen && result.length > 0) {
          result += '-'
          lastWasHyphen = true
        }
      } else {
        result += char
        lastWasHyphen = false
      }
    } else if (!lastWasHyphen && result.length > 0) {
      result += '-'
      lastWasHyphen = true
    }
  }

  return lastWasHyphen ? result.slice(0, -1) : result
}

/**
 * Builds an export download filename from survey / cycle / item parts.
 * @param {object} params - Filename parts.
 * @param {string} params.fileType - Export type label (e.g. RecordForm, Category). Optional for shorter names.
 * @param {object} [params.survey] - Survey object (used when surveyName is omitted).
 * @param {string} [params.surveyName] - Survey name override.
 * @param {string|number} [params.cycle] - Survey cycle.
 * @param {string} [params.itemName] - Extra item label (entity, category, taxonomy, …).
 * @param {string} [params.fileFormat] - Flat file format (csv, xlsx, …); used for extension.
 * @param {string} [params.extension] - Fallback extension when fileFormat is omitted.
 * @param {boolean} [params.includeTimestamp] - Whether to append a timestamp part.
 * @returns {string} Download filename including extension.
 */
const generate = ({
  fileType = null,
  survey = null,
  surveyName = null,
  cycle = null,
  itemName = null,
  fileFormat = null,
  extension = 'csv',
  includeTimestamp = false,
}) => {
  const parts = []
  if (surveyName || survey) {
    const name = sanitizeFileNamePart(surveyName ?? Survey.getName(survey))
    if (name) {
      parts.push(name)
    }
  }
  if (Objects.isNotEmpty(cycle)) {
    parts.push(`(cycle-${RecordCycle.getLabel(cycle)})`)
  }
  if (Objects.isNotEmpty(itemName)) {
    const sanitizedItemName = sanitizeFileNamePart(itemName)
    if (sanitizedItemName) {
      parts.push(sanitizedItemName)
    }
  }
  if (Objects.isNotEmpty(fileType)) {
    parts.push(fileType)
  }

  if (includeTimestamp) {
    parts.push(DateUtils.nowFormatDefault())
  }
  const finalExtension = getExtensionByFileFormat(fileFormat) ?? extension
  return `${parts.join('_')}.${finalExtension}`
}

export const ExportFileNameGenerator = {
  generate,
  sanitizeFileNamePart,
}
