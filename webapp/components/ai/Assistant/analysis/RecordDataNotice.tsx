import { Button } from '@webapp/components/buttons'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

type Props = { onNewConversation: () => void }

/**
 * Message shown instead of the composer when a conversation with record data can no longer continue.
 * @returns {React.ReactElement} The notice.
 */
export const RecordDataNotice = ({ onNewConversation }: Props) => {
  const i18n = useI18n()
  return (
    <div className="ai-record-data-notice" data-testid={TestId.aiAssistant.recordDataNotice}>
      <output className="ai-record-data-notice__message">{i18n.t('aiAnalysis.recordDataNotice.message')}</output>
      <Button
        className="btn-s"
        label="aiAnalysis.recordDataNotice.newConversation"
        onClick={onNewConversation}
        variant="outlined"
      />
    </div>
  )
}
