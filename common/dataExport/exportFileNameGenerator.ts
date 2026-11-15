import { Objects } from '@openforis/arena-core'
import type { Survey as ArenaSurvey } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import { RecordCycle } from '@core/record/recordCycle'
import * as DateUtils from '@core/dateUtils'
import { getExtensionByFileFormat } from '@core/fileFormats'

// removes leading and trailing hyphens with a linear scan: a regular expression (e.g. /-+$/) could backtrack super-linearly (Sonar S5852, S8786)
const trimHyphens = (value: string): string => {
  let start = 0
  let end = value.length
  while (start < end && value[start] === '-') start++
  while (end > start && value[end - 1] === '-') end--
  return value.slice(start, end)
}

// sanitizes a filename part for download Content-Disposition headers: special characters become hyphens,
// so names stay readable and free of URL-encoded sequences (e.g. %20); empty string if nothing usable remains
const sanitizeFileNamePart = (value: string | number | null | undefined): string => {
  if (value == null) {
    return ''
  }
  return trimHyphens(
    String(value)
      .trim()
      .replace(/[^A-Za-z0-9._-]+/g, '-')
  )
}

type GenerateParams = {
  // export type label (e.g. RecordForm, Category), optional for shorter names
  fileType?: string | null
  // used when surveyName is omitted
  survey?: ArenaSurvey | null
  surveyName?: string | null
  cycle?: string | number | null
  // extra item label (entity, category, taxonomy...)
  itemName?: string | null
  // flat file format (csv, xlsx...), determines the extension
  fileFormat?: string | null
  // extension used when fileFormat is omitted
  extension?: string
  includeTimestamp?: boolean
}

// builds an export download file name (with extension) from survey, cycle and item parts
const generate = ({
  fileType = null,
  survey = null,
  surveyName = null,
  cycle = null,
  itemName = null,
  fileFormat = null,
  extension = 'csv',
  includeTimestamp = false,
}: GenerateParams): string => {
  const parts: string[] = []
  if (surveyName || survey) {
    const name = sanitizeFileNamePart(surveyName ?? Survey.getName(survey))
    if (name) {
      parts.push(name)
    }
  }
  if (Objects.isNotEmpty(cycle)) {
    parts.push(`(cycle-${RecordCycle.getLabel(String(cycle))})`)
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
  // undefined for a missing or unknown file format
  const finalExtension =
    getExtensionByFileFormat(fileFormat as Parameters<typeof getExtensionByFileFormat>[0]) ?? extension
  return `${parts.join('_')}.${finalExtension}`
}

export const ExportFileNameGenerator = {
  generate,
  sanitizeFileNamePart,
}
