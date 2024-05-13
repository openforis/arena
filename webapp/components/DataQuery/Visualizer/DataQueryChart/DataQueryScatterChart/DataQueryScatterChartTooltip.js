import './DataQueryScatterChartTooltip.scss'

import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { debounce } from '@core/functionsDefer'
import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'

import * as API from '@webapp/service/api'
import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { RecordKeyValuesExtractor } from '@webapp/views/App/views/Data/Records/recordKeyValuesExtractor'

const FormItem = ({ label, children }) => (
  <div className="tooltip-form-item">
    <div className="tooltip-form-label">{label}:</div>
    <div className="tooltip-form-value">{children}</div>
  </div>
)

FormItem.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

const RecordInfoFormItems = ({ recordUuid }) => {
  const i18n = useI18n()
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
      <FormItem label={i18n.t('common.record')}>{loading ? '...' : recordKeys}</FormItem>
      <FormItem label={i18n.t('common.owner')}>{loading ? '...' : recordOwner}</FormItem>
    </>
  )
}

RecordInfoFormItems.propTypes = {
  recordUuid: PropTypes.string.isRequired,
}

export const DataQueryScatterChartTooltip = (props) => {
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

DataQueryScatterChartTooltip.propTypes = {
  active: PropTypes.bool,
  categoricalAttributeDefField: PropTypes.string,
  categoricalAttributeDefName: PropTypes.string,
  payload: PropTypes.array,
  xAxisName: PropTypes.string.isRequired,
  xAxisDataKey: PropTypes.string.isRequired,
  yAxisName: PropTypes.string.isRequired,
  yAxisDataKey: PropTypes.string.isRequired,
}
