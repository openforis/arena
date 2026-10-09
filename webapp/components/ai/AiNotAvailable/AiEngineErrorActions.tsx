import './AiNotAvailable.scss'

import React, { useCallback, useState } from 'react'

import { refreshAiCapabilities } from '@webapp/ai/engines/capabilitiesStore'
import { getAiEngineErrorView } from '@webapp/ai/engines/engineUi'
import { Button } from '@webapp/components/buttons'
import { TestId } from '@webapp/utils/testId'

import { useAiEngineActions } from './useAiEngineActions'

type Props = {
  // the error, or a `{ key }` object (e.g. a stored assistant error key)
  error: unknown
  // runs the request again (after the re-probe)
  onRetry: () => void
  // the Retry button is disabled (e.g. a request is running)
  disabled?: boolean
}

/**
 * Buttons under an engine error (local server down, model not loaded, no engine): Retry and Open the AI settings.
 * Renders nothing for other errors.
 * @param {Props} props - Props.
 * @returns {React.ReactElement|null} The buttons.
 */
export const AiEngineErrorActions = (props: Props) => {
  const { error, onRetry, disabled = false } = props
  const runAction = useAiEngineActions()
  const [retrying, setRetrying] = useState(false)
  const view = getAiEngineErrorView(error)

  const retry = useCallback(async () => {
    setRetrying(true)
    try {
      // the next resolveModel sees the new probe (e.g. the server is back, or the reasons it is not)
      await refreshAiCapabilities()
    } finally {
      setRetrying(false)
    }
    onRetry()
  }, [onRetry])

  if (!view || (!view.retry && !view.openSettings)) return null

  return (
    <div className="ai-not-available__actions">
      {view.retry && (
        <Button
          disabled={retrying || disabled}
          label="aiEngine.action.retry"
          onClick={retry}
          size="small"
          testId={TestId.ai.engineErrorRetry}
          variant="outlined"
        />
      )}
      {view.openSettings && (
        <Button
          label="aiEngine.action.openSettings"
          onClick={() => runAction('openSettings')}
          size="small"
          testId={TestId.ai.engineErrorOpenSettings}
          variant="text"
        />
      )}
    </div>
  )
}
