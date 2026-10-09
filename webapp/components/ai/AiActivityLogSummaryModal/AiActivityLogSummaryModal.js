import './AiActivityLogSummaryModal.scss'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import { AiWorkflows, getAiErrorMessage, isAiAbortError } from '@webapp/ai/workflows'
import { AiEngineErrorActions } from '@webapp/components/ai/AiNotAvailable'
import { AiFeatureDataLocationBadge } from '@webapp/components/ai/AiDataLocationBadge'
import { Modal, ModalBody } from '@webapp/components/modal'
import Markdown from '@webapp/components/markdown'
import { useI18n, useI18nT } from '@webapp/store/system'
import { useSurveyId, useSurveyInfo } from '@webapp/store/survey'

const AiActivityLogSummaryModal = ({ onClose }) => {
  const i18n = useI18n()
  // Server-side error messages may contain quoted identifiers (Postgres
  // column names, etc.) which i18next escapes by default — appears as
  // &quot; in the rendered panel. Render the {{message}}-bearing template
  // through unescapeHtml.
  const tUnescaped = useI18nT({ unescapeHtml: true })
  const surveyId = useSurveyId()
  const surveyInfo = useSurveyInfo()
  const surveyName = Survey.getName(surveyInfo)
  const cancelRef = useRef(null)

  const [text, setText] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)
  // the latest onClose at call time: a new callback identity must not restart the stream
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])
  const [attempt, setAttempt] = useState(0)
  const onRetry = useCallback(() => setAttempt((count) => count + 1), [])

  useEffect(() => {
    if (!surveyId) return undefined
    // Reset stream state when inputs change; the stream subscription below
    // is the external system this effect synchronizes with.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText('')

    setDone(false)

    setError(null)
    const cancel = AiWorkflows.summarizeActivityLog({
      surveyId,
      surveyName,
      onChunk: (chunk) => setText((prev) => prev + chunk),
      onDone: () => setDone(true),
      onError: (err) => {
        if (isAiAbortError(err)) {
          // the user closed the first-use dialog
          onCloseRef.current()
          return
        }
        setError(err)
        setDone(true)
      },
    })
    cancelRef.current = cancel
    return () => {
      cancelRef.current?.()
    }
  }, [surveyId, surveyName, attempt])

  const onCancel = () => {
    cancelRef.current?.()
    onClose()
  }

  const bodyContent = useMemo(() => {
    if (text) {
      return <Markdown source={text} />
    } else if (!done) {
      return i18n.t('aiActivityLog.thinking')
    }
    return null
  }, [text, done, i18n])

  return (
    <Modal className="ai-activity-log-summary-modal" title="aiActivityLog.title" showCloseButton onClose={onCancel}>
      <ModalBody>
        <AiFeatureDataLocationBadge feature="activityLogSummary" />
        <div className={`ai-activity-log-summary-modal__body${done ? '' : ' ai-activity-log-summary-modal__cursor'}`}>
          {bodyContent}
        </div>

        {error ? (
          <div className="ai-activity-log-summary-modal__error">
            {tUnescaped('aiActivityLog.error', { message: getAiErrorMessage({ error, i18n }) })}
            <AiEngineErrorActions error={error} onRetry={onRetry} />
          </div>
        ) : null}
      </ModalBody>
    </Modal>
  )
}

AiActivityLogSummaryModal.propTypes = {
  onClose: PropTypes.func.isRequired,
}

export default AiActivityLogSummaryModal
