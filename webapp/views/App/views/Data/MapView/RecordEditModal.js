import React, { useCallback } from 'react'

import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import { NodeValueFormatter } from '@core/record/nodeValueFormatter'

import { ResizableModal } from '@webapp/components'
import RecordEditor from '@webapp/components/survey/Record'
import { useRecord } from '@webapp/store/ui/record'
import { useI18n } from '@webapp/store/system'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { appModuleUri, noHeaderModules } from '@webapp/app/appModules'
import { WindowUtils } from '@webapp/utils/windowUtils'

const RecordEditModalTitle = () => {
  const i18n = useI18n()
  const survey = useSurvey()
  const record = useRecord()
  const lang = useSurveyPreferredLang()

  if (!record) return null

  const root = Record.getRootNode(record)
  const keyNodes = Record.getEntityKeyNodes(survey, root)(record)
  const keyValues = keyNodes.map((keyNode) => {
    const keyNodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(keyNode))(survey)
    return NodeValueFormatter.format({
      survey,
      nodeDef: keyNodeDef,
      value: Node.getValue(keyNode),
      showLabel: true,
      lang,
    })
  })

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

  const onModalClose = useCallback(
    ({ modalState }) => {
      onClose()
    },
    [onClose]
  )

  const modalProps = {
    height: 600,
    left: undefined,
    top: undefined,
    width: 1000,
  }

  return (
    <ResizableModal
      className="map-record-edit-modal"
      header={<RecordEditModalTitle />}
      initWidth={modalProps.width}
      initHeight={modalProps.height}
      left={modalProps.left}
      onClose={onModalClose}
      onRequestClose={onClose}
      onDetach={onDetach}
      top={modalProps.top}
    >
      <RecordEditor recordUuid={recordUuid} pageNodeUuid={parentNodeUuid} noHeader />
    </ResizableModal>
  )
}
