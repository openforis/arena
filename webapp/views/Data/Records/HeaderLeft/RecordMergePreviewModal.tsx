import './RecordMergePreviewModal.scss'

import { NodeValueFormatter } from '@core/record/nodeValueFormatter'
import { Button, ResizableModal } from '@webapp/components'
import RecordEditor from '@webapp/components/survey/Record'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { useRecord } from '@webapp/store/ui/record'

const initialHeight = 600
const initialWidth = 1000

const ModalTitle = () => {
  const i18n = useI18n()
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()
  const record = useRecord()

  if (!record) return null

  const keyValues = NodeValueFormatter.getFormattedRecordKeys({ survey, record, lang, showLabel: true }).join(', ')

  const title = i18n.t('dataView:records.merge.previewTitle', { keyValues })

  return <span>{title}</span>
}

type RecordMergePreviewModalProps = {
  onConfirmClick: (...args: any[]) => any
  onRequestClose: (...args: any[]) => any
}

export const RecordMergePreviewModal = (props: RecordMergePreviewModalProps) => {
  const { onConfirmClick, onRequestClose } = props

  const record = useRecord()

  return (
    <ResizableModal
      className="record-merge-confirm-modal"
      header={<ModalTitle />}
      initWidth={initialWidth}
      initHeight={initialHeight}
      onRequestClose={onRequestClose}
    >
      <RecordEditor editable={false} record={record} noHeader disableLockUnlock disableValidationReport />
      <div className="button-bar">
        <Button className="btn-cancel" onClick={onRequestClose} label="common.cancel" variant="outlined" />
        <Button
          className="btn-primary"
          onClick={onConfirmClick}
          iconClassName="icon-floppy-disk icon-12px"
          label="dataView:records.merge.confirmLabel"
        />
      </div>
    </ResizableModal>
  )
}
