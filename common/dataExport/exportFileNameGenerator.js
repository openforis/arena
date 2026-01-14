import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import { RecordCycle } from '@core/record/recordCycle'
import * as DateUtils from '@core/dateUtils'
import { getExtensionByFileFormat } from '@core/fileFormats'

const generate = ({
  fileType,
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
    parts.push(surveyName ?? Survey.getName(survey))
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
  const finalExtension = getExtensionByFileFormat(fileFormat) ?? extension
  return `${parts.join('_')}.${finalExtension}`
}

export const ExportFileNameGenerator = {
  generate,
}
