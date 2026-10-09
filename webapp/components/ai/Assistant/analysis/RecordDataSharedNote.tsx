import React from 'react'

import { getConversationDataClass } from '@webapp/ai/conversations/dataClass'
import { useI18n } from '@webapp/store/system'

type Props = { conversation: { dataClass?: unknown } | null }

/**
 * Note shown next to the data location badge once the conversation has received record data.
 * @param {Props} props - Props.
 * @returns {React.ReactElement|null} The note.
 */
export const RecordDataSharedNote = ({ conversation }: Props) => {
  const i18n = useI18n()
  if (!conversation || getConversationDataClass(conversation) !== 'data') return null
  return <span className="ai-record-data-shared">{i18n.t('aiAnalysis.recordDataShared')}</span>
}
