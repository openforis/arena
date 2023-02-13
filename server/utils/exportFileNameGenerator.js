import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as DateUtils from '@core/dateUtils'

const generate = ({ survey, fileType, cycle, itemName = null, extension = 'csv', includeTimestamp = false }) => {
  const surveyName = Survey.getName(survey)
  const cyclePart = Objects.isEmpty(cycle) ? '' : `_${`(cycle-${Number(cycle) + 1})`}`
  const itemNamePart = itemName ? `_${itemName}` : ''
  const timestampPart = includeTimestamp ? `_${DateUtils.nowFormatDefault()}` : ''
  return `${surveyName}${cyclePart}${itemNamePart}_${fileType}${timestampPart}.${extension}`
}

export const ExportFileNameGenerator = {
  generate,
}
