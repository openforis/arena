import React from 'react'
import PropTypes from 'prop-types'

import SurveyForm from '@webapp/components/survey/SurveyForm'

import { useLocalState } from './store'
import { useI18n } from '@webapp/store/system'

const Record = (props) => {
  const {
    editable: editableProp = true,
    locked = false,
    noHeader = false,
    pageNodeUuid,
    record: recordProp = null,
    recordUuid,
  } = props
  const { editable, preview, record, recordLoadError } = useLocalState({
    editableProp,
    locked,
    noHeader,
    pageNodeUuid,
    recordProp,
    recordUuid,
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

Record.propTypes = {
  editable: PropTypes.bool,
  locked: PropTypes.bool,
  noHeader: PropTypes.bool,
  pageNodeUuid: PropTypes.string,
  record: PropTypes.object,
  recordUuid: PropTypes.string,
}
