import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import { RecordCycle } from '@core/record/recordCycle'
import * as DateUtils from '@core/dateUtils'

const generate = ({ survey, fileType, cycle, itemName = null, extension = 'csv', includeTimestamp = false }) => {
  const parts = [Survey.getName(survey)]

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
  return `${parts.join('_')}.${extension}`
}

export const ExportFileNameGenerator = {
  generate,
}
