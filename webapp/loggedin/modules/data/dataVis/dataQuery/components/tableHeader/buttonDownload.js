import React from 'react'
import PropTypes from 'prop-types'

import * as DataSort from '@common/surveyRdb/dataSort'

import { useSurveyCycleKey, useSurveyId } from '@webapp/components/hooks'
import DownloadButton from '@webapp/components/form/downloadButton'

const ButtonDownload = (props) => {
  const { nodeDefUuidContext, nodeDefUuidCols, filter, sort, disabled } = props

  const surveyId = useSurveyId()
  const surveyCycleKey = useSurveyCycleKey()

  const requestParams = {
    filter: JSON.stringify(filter),
    sort: DataSort.toHttpParams(sort),
    nodeDefUuidCols: JSON.stringify(nodeDefUuidCols),
    cycle: surveyCycleKey,
  }

  const href = `/api/surveyRdb/${surveyId}/${nodeDefUuidContext}/export`

  return (
    <DownloadButton
      href={href}
      requestMethod="POST"
      requestParams={requestParams}
      showLabel={false}
      disabled={disabled}
    />
  )
}

ButtonDownload.propTypes = {
  nodeDefUuidContext: PropTypes.string.isRequired,
  nodeDefUuidCols: PropTypes.arrayOf(String).isRequired,
  filter: PropTypes.object,
  sort: PropTypes.arrayOf(Object).isRequired,
  disabled: PropTypes.bool.isRequired,
}

ButtonDownload.defaultProps = {
  filter: null,
}

export default ButtonDownload
