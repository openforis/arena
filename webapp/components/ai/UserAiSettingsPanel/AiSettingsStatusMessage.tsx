import React, { useState } from 'react'

import { useI18n } from '@webapp/store/system'

export type AiSettingsStatus = {
  kind: 'info' | 'ok' | 'fail'
  summary: string
  // Technical details (e.g. the provider error), shown on request.
  details?: string | null
}

type Props = {
  status: AiSettingsStatus
}

/**
 * Result of the last provider call (test connection or models fetch), with collapsible details.
 * @param {Props} props - The props.
 * @returns {React.ReactElement} The status message.
 */
export const AiSettingsStatusMessage = ({ status }: Props): React.ReactElement => {
  const i18n = useI18n()
  const [detailsShown, setDetailsShown] = useState(false)
  const { kind, summary, details } = status
  return (
    <div className={`user-ai-settings-panel__test ${kind}`}>
      <div>
        {summary}
        {details && (
          <button
            type="button"
            className="user-ai-settings-panel__details-toggle"
            onClick={() => setDetailsShown((shown) => !shown)}
          >
            {i18n.t(detailsShown ? 'userAiSettings:hideDetails' : 'userAiSettings:showDetails')}
          </button>
        )}
      </div>
      {details && detailsShown && <div className="user-ai-settings-panel__details">{details}</div>}
    </div>
  )
}
