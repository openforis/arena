import './AiActivityLogSummaryModal.scss'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import { AiWorkflows, getAiErrorMessage } from '@webapp/ai/workflows'
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
        setError(getAiErrorMessage({ error: err, i18n }))
        setDone(true)
      },
    })
    cancelRef.current = cancel
    return () => {
      cancelRef.current?.()
    }
  }, [surveyId, surveyName, i18n])

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
        <div className={`ai-activity-log-summary-modal__body${done ? '' : ' ai-activity-log-summary-modal__cursor'}`}>
          {bodyContent}
        </div>

        {error ? (
          <div className="ai-activity-log-summary-modal__error">
            {tUnescaped('aiActivityLog.error', { message: error })}
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
