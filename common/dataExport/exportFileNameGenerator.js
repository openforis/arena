import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import { RecordCycle } from '@core/record/recordCycle'
import * as DateUtils from '@core/dateUtils'
import { getExtensionByFileFormat } from '@core/fileFormats'

/**
 * Sanitizes a filename part for download Content-Disposition headers.
 * Replaces whitespace and special characters with hyphens so names stay
 * human-readable and free of URL-encoded sequences (e.g. %20).
 * @param {string|null|undefined} value - Raw filename part.
 * @returns {string} Sanitized part, or empty string if nothing usable remains.
 */
const sanitizeFileNamePart = (value) => {
  if (value == null) {
    return ''
  }
  return String(value)
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
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
