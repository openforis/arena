import React from 'react'

import SurveyForm from '@webapp/components/survey/SurveyForm'

import { useLocalState } from './store'
import { useI18n } from '@webapp/store/system'

const Record = (props) => {
  const { editable: editableProp = true, record: recordProp, recordUuid, pageNodeUuid, noHeader = false } = props
  const { editable, preview, record, recordLoadError } = useLocalState({
    recordProp,
    recordUuid,
    editableProp,
    pageNodeUuid,
    noHeader,
  })

  const i18n = useI18n()

  if (recordLoadError) {
    return <div>{i18n.t('recordView.errorLoadingRecord', { details: i18n.t(recordLoadError) })}</div>
  }
  if (!record) {
    return null
  }
  return <SurveyForm draft={preview} preview={preview} edit={false} entry canEditRecord={editable} />
}

export default Record
