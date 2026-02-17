import React from 'react'
import PropTypes from 'prop-types'

import SurveyForm from '@webapp/components/survey/SurveyForm'

import { useLocalState } from './store'
import { useI18n } from '@webapp/store/system'

const Record = (props) => {
  const {
    disableLockUnlock = false,
    disableValidationReport = false,
    editable: editableProp = true,
    locked = false,
    noHeader = false,
    pageNodeIId,
    record: recordProp = null,
    recordUuid,
  } = props
  const { editable, preview, record, recordLoadError } = useLocalState({
    editableProp,
    locked,
    noHeader,
    pageNodeIId,
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
  return (
    <SurveyForm
      disableLockUnlock={disableLockUnlock}
      disableValidationReport={disableValidationReport}
      draft={preview}
      preview={preview}
      edit={false}
      entry
      canEditRecord={editable}
    />
  )
}

export default Record

Record.propTypes = {
  disableLockUnlock: PropTypes.bool,
  disableValidationReport: PropTypes.bool,
  editable: PropTypes.bool,
  locked: PropTypes.bool,
  noHeader: PropTypes.bool,
  pageNodeIId: PropTypes.number,
  record: PropTypes.object,
  recordUuid: PropTypes.string,
}
