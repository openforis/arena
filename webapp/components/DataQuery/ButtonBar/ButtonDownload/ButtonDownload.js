import React from 'react'
import PropTypes from 'prop-types'

import { Query } from '@common/model/query'

import * as API from '@webapp/service/api'
import { ButtonDownload as ButtonDownloadSimple } from '@webapp/components/buttons'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'

const ButtonDownload = (props) => {
  const { disabled, query } = props

  const entityDefUuid = Query.getEntityDefUuid(query)

  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()

  const onClick = async () => {
    const tempFileName = await API.exportDataQueryToTempFile({ surveyId, cycle, query })
    API.downloadDataQueryExport({ surveyId, cycle, entityDefUuid, tempFileName })
  }

  return <ButtonDownloadSimple disabled={disabled} label="common.csvExport" onClick={onClick} />
}

ButtonDownload.propTypes = {
  disabled: PropTypes.bool.isRequired,
  query: PropTypes.object.isRequired,
}

export default ButtonDownload
