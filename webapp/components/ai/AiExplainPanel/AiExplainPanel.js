import './AiExplainPanel.scss'

import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import { AiWorkflows, getAiErrorKey, getAiErrorMessage } from '@webapp/ai/workflows'
import { Modal, ModalBody } from '@webapp/components/modal'
import Markdown from '@webapp/components/markdown'
import { useI18n, useI18nT } from '@webapp/store/system'
import { useSurvey, useSurveyId } from '@webapp/store/survey'

const AiExplainPanel = ({ expression, nodeDefUuid, errorMessage, onClose }) => {
  const i18n = useI18n()
  // See AiActivityLogSummary: i18next escapes {{message}} by default,
  // which mangles quoted identifiers (e.g. Postgres column names) in
  // server-side error strings. Render this template via unescapeHtml.
  const tUnescaped = useI18nT({ unescapeHtml: true })
  const survey = useSurvey()
  const surveyId = useSurveyId()
  const cancelRef = useRef(null)
  // read the latest survey at call time: a store update must not restart the stream
  const surveyRef = useRef(survey)
  useEffect(() => {
    surveyRef.current = survey
  }, [survey])

  const [text, setText] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Reset stream state when inputs change; the stream subscription below
    // is the external system this effect synchronizes with.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText('')

    setDone(false)

    setError(null)
    const cancel = AiWorkflows.explainExpression({
      survey: surveyRef.current,
      surveyId,
      nodeDefUuid,
      expression,
      errorMessage,
      onChunk: (chunk) => setText((prev) => prev + chunk),
      onDone: () => setDone(true),
      onError: (err) => {
        setError(err)
        setDone(true)
      },
    })
    cancelRef.current = cancel
    return () => {
      cancelRef.current?.()
    }
  }, [surveyId, nodeDefUuid, expression, errorMessage])

  const onCancel = () => {
    cancelRef.current?.()
    onClose()
  }

  return (
    <Modal className="ai-explain-panel" title="aiExpression.explain.title" showCloseButton onClose={onCancel}>
      <ModalBody>
        <div className="ai-explain-panel__expression">{expression}</div>

        <div className={`ai-explain-panel__body${done ? '' : ' ai-explain-panel__cursor'}`}>
          {text && <Markdown source={text} />}
          {!text && !done && i18n.t('aiExpression.explain.thinking')}
        </div>

        {error ? (
          <div className="ai-explain-panel__error">
            {getAiErrorKey(error) === 'aiRequestTimeout'
              ? i18n.t('aiExpression.explain.timeout')
              : tUnescaped('aiExpression.explain.error', { message: getAiErrorMessage({ error, i18n }) })}
          </div>
        ) : null}
      </ModalBody>
    </Modal>
  )
}

AiExplainPanel.propTypes = {
  expression: PropTypes.string.isRequired,
  nodeDefUuid: PropTypes.string,
  errorMessage: PropTypes.string,
  onClose: PropTypes.func.isRequired,
}

export default AiExplainPanel
