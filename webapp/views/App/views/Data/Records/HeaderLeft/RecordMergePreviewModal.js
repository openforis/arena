import './RecordMergePreviewModal.scss'

import React from 'react'
import PropTypes from 'prop-types'

import { NodeValueFormatter } from '@core/record/nodeValueFormatter'

import { Button, ResizableModal } from '@webapp/components'
import RecordEditor from '@webapp/components/survey/Record'
import { useRecord } from '@webapp/store/ui/record'
import { useI18n } from '@webapp/store/system'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'

const initialHeight = 600
const initialWidth = 1000

const ModalTitle = () => {
  const i18n = useI18n()
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()
  const record = useRecord()

  if (!record) return null

  const keyValues = NodeValueFormatter.getFormattedRecordKeys({ survey, record, lang, showLabel: true }).join(', ')

  const title = i18n.t('dataView.records.merge.previewTitle', { keyValues })

  return <span>{title}</span>
}

export const RecordMergePreviewModal = (props) => {
  const { onRequestClose } = props

  const record = useRecord()

  return (
    <ResizableModal
      className="record-merge-confirm-modal"
      header={<ModalTitle />}
      initWidth={initialWidth}
      initHeight={initialHeight}
      onRequestClose={onRequestClose}
    >
      <RecordEditor editable={false} record={record} noHeader />
      <div className="button-bar">
        <Button className="btn-cancel" onClick={onRequestClose} label="common.cancel" variant="outlined" />
        <Button
          className="btn-primary"
          onClick={() => {}}
          iconClassName="icon-floppy-disk icon-12px"
          label="dataView.records.merge.confirmLabel"
        />
      </div>
    </ResizableModal>
  )
}

RecordMergePreviewModal.propTypes = {
  onRequestClose: PropTypes.func,
}
