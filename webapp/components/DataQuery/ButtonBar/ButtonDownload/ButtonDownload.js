import React from 'react'
import PropTypes from 'prop-types'

import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'

import DownloadButton from '@webapp/components/form/downloadButton'
import { Query } from '@common/model/query'

const ButtonDownload = (props) => {
  const { disabled, query } = props
  const entityDefUuid = Query.getEntityDefUuid(query)
  const attributeDefUuids = Query.getAttributeDefUuids(query)
  const filter = Query.getFilter(query)
  const sort = Query.getSort(query)

  const surveyId = useSurveyId()
  const surveyCycleKey = useSurveyCycleKey()

  const requestParams = {
    filter: JSON.stringify(filter),
    sort: JSON.stringify(sort),
    nodeDefUuidCols: JSON.stringify(attributeDefUuids),
    cycle: surveyCycleKey,
  }

  const href = `/api/surveyRdb/${surveyId}/${entityDefUuid}/export`

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
  disabled: PropTypes.bool.isRequired,
  query: PropTypes.object.isRequired,
}

export default ButtonDownload
