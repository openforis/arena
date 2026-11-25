import { useCallback, useMemo, useState } from 'react'

import * as ObjectUtils from '@core/objectUtils'
import { RecordSummary } from '@core/record/recordSummary'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { Dropdown } from '@webapp/components/form'
import * as API from '@webapp/service/api'
import { useSurvey, useSurveyCycleKey, useSurveyInfo } from '@webapp/store/survey'

type RecordsDropdownProps = {
  disabled?: boolean
  onChange: (...args: any[]) => any
  readOnly?: boolean
  selectedUuids?: string[]
  testId?: string
}

const RecordsDropdown = (props: RecordsDropdownProps) => {
  const { disabled = false, onChange, readOnly = false, selectedUuids = null, testId } = props

  const surveyInfo = useSurveyInfo()
  const surveyId = Survey.getId(surveyInfo)
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()

  const [state, setState] = useState({ loading: true, recordsByUuid: {} })
  const { loading, recordsByUuid } = state

  const selectedRecords = useMemo(
    () => selectedUuids?.map((uuid) => recordsByUuid[uuid]).filter(Boolean),
    [recordsByUuid, selectedUuids]
  )

  const recordsLookupFunction = useCallback(
    async (search) => {
      const records = await API.fetchRecordsSummary({ surveyId, cycle, search })
      const _recordsByUuid = ObjectUtils.toUuidIndexedObj(records)
      setState({ loading: false, recordsByUuid: _recordsByUuid })
      return records
    },
    [cycle, surveyId]
  )

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
      items={recordsLookupFunction}
      itemValue="uuid"
      itemLabel={recordLabelFunction}
      loading={loading}
      multiple
      onChange={onChange}
      readOnly={readOnly}
      selection={selectedRecords}
      testId={testId}
    />
  )
}

export default RecordsDropdown
