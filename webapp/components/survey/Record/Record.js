import React from 'react'
import PropTypes from 'prop-types'

import SurveyForm from '@webapp/components/survey/SurveyForm'

import { useLocalState } from './store'
import { useI18n } from '@webapp/store/system'

const Record = (props) => {
  const { locked = false, noHeader = false, pageNodeUuid, recordUuid } = props
  const { editable, preview, record, recordLoadError } = useLocalState({ recordUuid, pageNodeUuid, noHeader, locked })

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
  locked: PropTypes.bool,
  noHeader: PropTypes.bool,
  pageNodeUuid: PropTypes.string,
  recordUuid: PropTypes.string,
}
