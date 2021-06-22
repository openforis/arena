import React from 'react'
import PropTypes from 'prop-types'

import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'

import DownloadButton from '@webapp/components/form/downloadButton'
import { Query } from '@common/model/query'
import { useI18n } from '@webapp/store/system'

const ButtonDownload = (props) => {
  const { disabled, query } = props

  const i18n = useI18n()

  const entityDefUuid = Query.getEntityDefUuid(query)

  const surveyId = useSurveyId()
  const surveyCycleKey = useSurveyCycleKey()

  const requestParams = {
    cycle: surveyCycleKey,
    query,
  }

  const href = `/api/surveyRdb/${surveyId}/${entityDefUuid}/export`

  return (
    <DownloadButton
      href={href}
      requestMethod="POST"
      requestParams={requestParams}
      showLabel={false}
      disabled={disabled}
      title={i18n.t('common.csvExport')}
    />
  )
}

ButtonDownload.propTypes = {
  disabled: PropTypes.bool.isRequired,
  query: PropTypes.object.isRequired,
}

export default ButtonDownload
