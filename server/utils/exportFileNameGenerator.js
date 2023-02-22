import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import { RecordCycle } from '@core/record/recordCycle'
import * as DateUtils from '@core/dateUtils'

const generate = ({ survey, fileType, cycle, itemName = null, extension = 'csv', includeTimestamp = false }) => {
  const surveyName = Survey.getName(survey)
  const cyclePart = Objects.isEmpty(cycle) ? '' : `_${`(cycle-${RecordCycle.getLabel(cycle)})`}`
  const itemNamePart = itemName ? `_${itemName}` : ''
  const timestampPart = includeTimestamp ? `_${DateUtils.nowFormatDefault()}` : ''
  return `${surveyName}${cyclePart}${itemNamePart}_${fileType}${timestampPart}.${extension}`
}

export const ExportFileNameGenerator = {
  generate,
}
