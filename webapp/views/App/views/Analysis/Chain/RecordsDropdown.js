import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { RecordSummary } from '@core/record/recordSummary'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as API from '@webapp/service/api'
import { useSurvey, useSurveyCycleKey, useSurveyInfo } from '@webapp/store/survey'
import { Dropdown } from '@webapp/components/form'

const RecordsDropdown = (props) => {
  const { disabled = false, onChange, readOnly = false, selectedUuids = null, testId } = props

  const surveyInfo = useSurveyInfo()
  const surveyId = Survey.getId(surveyInfo)
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()

  const [state, setState] = useState({ loading: true, records: [] })
  const { loading, records } = state

  const loadRecords = useCallback(async () => {
    const _records = await API.fetchRecordsSummary({ surveyId, cycle })
    setState({ loading: false, records: _records })
  }, [cycle, surveyId])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  const recordLabelFunction = useCallback(
    (record) => {
      const rootKeys = Survey.getNodeDefRootKeys(survey)
      return rootKeys.map((keyDef) => RecordSummary.getKeyValue(NodeDef.getName(keyDef))(record)).join(', ')
    },
    [survey]
  )

  return (
    <Dropdown
      className="form-input-container"
      disabled={disabled}
      items={records}
      itemValue="uuid"
      itemLabel={recordLabelFunction}
      loading={loading}
      multiple
      onChange={onChange}
      readOnly={readOnly}
      selection={selectedUuids}
      testId={testId}
    />
  )
}

RecordsDropdown.propTypes = {
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  selectedUuids: PropTypes.string,
  testId: PropTypes.string,
}

export default RecordsDropdown
