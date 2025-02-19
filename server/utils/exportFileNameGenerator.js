import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import { RecordCycle } from '@core/record/recordCycle'
import * as DateUtils from '@core/dateUtils'

import { FileFormats } from './file/fileFormats'

const extensionByFileFormat = {
  [FileFormats.csv]: 'csv',
  [FileFormats.xlsx]: 'xlsx',
}

const getExtensionByFileFormat = (fileFormat) => extensionByFileFormat[fileFormat ?? FileFormats.csv]

const generate = ({
  fileType,
  survey = null,
  cycle = null,
  itemName = null,
  fileFormat = null,
  extension = 'csv',
  includeTimestamp = false,
}) => {
  const parts = []
  if (survey) {
    parts.push(Survey.getName(survey))
  }
  if (Objects.isNotEmpty(cycle)) {
    parts.push(`(cycle-${RecordCycle.getLabel(cycle)})`)
  }
  if (Objects.isNotEmpty(itemName)) {
    parts.push(encodeURIComponent(itemName))
  }
  parts.push(fileType)

  if (includeTimestamp) {
    parts.push(DateUtils.nowFormatDefault())
  }
  const finalExtension = extensionByFileFormat[fileFormat] ?? extension
  return `${parts.join('_')}.${finalExtension}`
}

export const ExportFileNameGenerator = {
  generate,
  getExtensionByFileFormat,
}
