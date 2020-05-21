import React from 'react'
import PropTypes from 'prop-types'

import * as DataSort from '@common/surveyRdb/dataSort'

import { useSurveyCycleKey, useSurveyId } from '@webapp/commonComponents/hooks'
import DownloadButton from '@webapp/commonComponents/form/downloadButton'

const ButtonDownload = (props) => {
  const { nodeDefUuidContext, nodeDefUuidCols, filter, sort, editMode } = props
  const surveyId = useSurveyId()
  const surveyCycleKey = useSurveyCycleKey()

  const downloadParams = {
    filter: JSON.stringify(filter),
    sort: DataSort.toHttpParams(sort),
    nodeDefUuidCols: JSON.stringify(nodeDefUuidCols),
    cycle: surveyCycleKey,
  }
  const downloadParamsStr = Object.entries(downloadParams)
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
  const downloadLink = `/api/surveyRdb/${surveyId}/${nodeDefUuidContext}/export?${downloadParamsStr}`

  return <DownloadButton href={downloadLink} showLabel={false} disabled={editMode} />
}

ButtonDownload.propTypes = {
  nodeDefUuidContext: PropTypes.string.isRequired,
  nodeDefUuidCols: PropTypes.arrayOf(String).isRequired,
  filter: PropTypes.object,
  sort: PropTypes.arrayOf(Object).isRequired,
  editMode: PropTypes.bool.isRequired,
}

ButtonDownload.defaultProps = {
  filter: null,
}

export default ButtonDownload
