import React, { useCallback } from 'react'

import * as Record from '@core/record/record'

import { ResizableModal } from '@webapp/components'
import RecordEditor from '@webapp/components/survey/Record'
import { useRecord } from '@webapp/store/ui/record'
import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { appModuleUri, noHeaderModules } from '@webapp/app/appModules'
import { WindowUtils } from '@webapp/utils/windowUtils'

const RecordEditModalTitle = () => {
  const i18n = useI18n()
  const survey = useSurvey()
  const record = useRecord()

  if (!record) return null

  const root = Record.getRootNode(record)
  const keyValues = Record.getEntityKeyValues(survey, root)(record)
  const title = i18n.t('mapView.recordEditModalTitle', { keyValues })

  return <span>{title}</span>
}

export const RecordEditModal = (props) => {
  const { onClose, recordUuid, parentNodeUuid } = props

  const onDetach = useCallback(() => {
    const recordEditUrl = `${window.location.origin}${appModuleUri(noHeaderModules.record)}${recordUuid}`
    WindowUtils.openPopup(recordEditUrl, 'arena-map-record-editor')
    onClose()
  }, [onClose, recordUuid])

  return (
    <ResizableModal
      className="map-record-edit-modal"
      header={<RecordEditModalTitle />}
      initWidth={1000}
      initHeight={600}
      onClose={onClose}
      onDetach={onDetach}
    >
      <RecordEditor recordUuid={recordUuid} pageNodeUuid={parentNodeUuid} noHeader />
    </ResizableModal>
  )
}
