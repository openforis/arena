import React from 'react'

import SurveyForm from '@webapp/components/survey/SurveyForm'
import { useI18n } from '@webapp/store/system'

import { useLocalState } from './store'

const Record = (props) => {
  const { recordUuid, pageNodeUuid, noHeader = false } = props
  const { editable, preview, record, recordLoadError } = useLocalState({ recordUuid, pageNodeUuid, noHeader })

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
