import React from 'react'
import PropTypes from 'prop-types'

import { Query } from '@common/model/query'

import { ButtonDownload as ButtonDownloadSimple } from '@webapp/components/buttons'

import * as API from '@webapp/service/api'

import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { DataExplorerSelectors } from '@webapp/store/dataExplorer'

const ButtonDownload = (props) => {
  const { disabled } = props

  const query = DataExplorerSelectors.useQuery()

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
}

export default ButtonDownload
