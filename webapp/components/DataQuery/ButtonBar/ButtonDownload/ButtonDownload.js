import React from 'react'
import PropTypes from 'prop-types'

import { Query } from '@common/model/query'

import * as API from '@webapp/service/api'
import DownloadButton from '@webapp/components/form/downloadButton'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

const ButtonDownload = (props) => {
  const { disabled, query } = props

  const i18n = useI18n()

  const entityDefUuid = Query.getEntityDefUuid(query)

  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()

  const onClick = async () => {
    const tempFileName = await API.exportDataQueryToTempFile({ surveyId, cycle, query })
    API.downloadDataQueryExport({ surveyId, entityDefUuid, tempFileName })
  }

  return <DownloadButton disabled={disabled} title={i18n.t('common.csvExport')} showLabel={false} onClick={onClick} />
}

ButtonDownload.propTypes = {
  disabled: PropTypes.bool.isRequired,
  query: PropTypes.object.isRequired,
}

export default ButtonDownload
