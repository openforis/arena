import './DataQueryScatterChartTooltip.scss'

import { type ReactNode, useCallback, useEffect, useState } from 'react'

import { debounce } from '@core/functionsDefer'
import * as Record from '@core/record/record'
import * as Survey from '@core/survey/survey'
import * as API from '@webapp/service/api'
import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { RecordKeyValuesExtractor } from '@webapp/views/Data/Records/recordKeyValuesExtractor'

type FormItemProps = {
  label: string
  children: ReactNode
}

const FormItem = ({ label, children }: FormItemProps) => {
  const i18n = useI18n()

  return (
    <div className="tooltip-form-item">
      <div className="tooltip-form-label">{i18n.t(label)}:</div>
      <div className="tooltip-form-value">{children}</div>
    </div>
  )
}

type RecordInfoFormItemsProps = {
  recordUuid: string
}

const RecordInfoFormItems = ({ recordUuid }: RecordInfoFormItemsProps) => {
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()

  const [state, setState] = useState({
    loading: true,
    recordKeys: [],
    recordOwner: null,
  })

  const { loading, recordKeys, recordOwner } = state

  const fetchRecordInfo = useCallback(async () => {
    const surveyId = Survey.getId(survey)
    const record = await API.fetchRecordSummary({ surveyId, cycle, recordUuid })
    const recordKeys = RecordKeyValuesExtractor.extractKeyValues({ survey, record })
    const recordOwner = Record.getOwnerName(record)

    setState({ loading: false, recordKeys, recordOwner })
  }, [cycle, recordUuid, survey])

  useEffect(() => {
    // fetch record keys on component mount with some delay to avoid sending too many requests to the server
    debounce(fetchRecordInfo, 'data_query_chart_record_fetch', 500)()
  }, [fetchRecordInfo])

  return (
    <>
      <FormItem label="common.record">{loading ? '...' : recordKeys}</FormItem>
      <FormItem label="common.owner">{loading ? '...' : recordOwner}</FormItem>
    </>
  )
}

type DataQueryScatterChartTooltipProps = {
  active?: boolean
  categoricalAttributeDefField?: string
  categoricalAttributeDefName?: string
  payload?: any[]
  xAxisName: string
  xAxisDataKey: string
  yAxisName: string
  yAxisDataKey: string
}

export const DataQueryScatterChartTooltip = (props: DataQueryScatterChartTooltipProps) => {
  const {
    active,
    categoricalAttributeDefField,
    categoricalAttributeDefName,
    payload,
    xAxisName,
    xAxisDataKey,
    yAxisName,
    yAxisDataKey,
  } = props
  if (!active || !payload?.length) return null

  const { payload: dataItem } = payload[0]
  return (
    <div className="data-query-chart-custom-tooltip">
      <RecordInfoFormItems recordUuid={dataItem['record_uuid']} />
      {categoricalAttributeDefName && (
        <FormItem label={categoricalAttributeDefName}>{dataItem[categoricalAttributeDefField]}</FormItem>
      )}
      <FormItem label={xAxisName}>{dataItem[xAxisDataKey]}</FormItem>
      <FormItem label={yAxisName}>{dataItem[yAxisDataKey]}</FormItem>
    </div>
  )
}
