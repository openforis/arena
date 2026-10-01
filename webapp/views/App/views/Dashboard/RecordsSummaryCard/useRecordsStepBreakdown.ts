import { useMemo } from 'react'

import { useSurveyInfo } from '@webapp/store/survey'

import { useRecordsSummaryContext } from '../RecordsSummaryContext'
import { surveyIncludesCleansingStep } from '../utils/surveyIncludesCleansingStep'

export type RecordsStepRow = { key: 'entry' | 'cleansing' | 'analysis'; labelKey: string; count: number }

/**
 * Records count per workflow step; the cleansing step is omitted when the survey doesn't use it.
 *
 * @returns {RecordsStepRow[]} The rows to display.
 */
export const useRecordsStepBreakdown = (): RecordsStepRow[] => {
  const surveyInfo = useSurveyInfo()
  const { dataEntry, dataCleansing, dataAnalysis } = useRecordsSummaryContext()

  return useMemo(() => {
    const rows: RecordsStepRow[] = [{ key: 'entry', labelKey: 'homeView:dashboard.step.entry', count: dataEntry }]
    if (surveyIncludesCleansingStep(surveyInfo)) {
      rows.push({ key: 'cleansing', labelKey: 'homeView:dashboard.step.cleansing', count: dataCleansing })
    }
    rows.push({ key: 'analysis', labelKey: 'homeView:dashboard.step.analysis', count: dataAnalysis })
    return rows
  }, [surveyInfo, dataEntry, dataCleansing, dataAnalysis])
}
