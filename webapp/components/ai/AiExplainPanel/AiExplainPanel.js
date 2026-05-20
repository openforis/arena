import './AiExplainPanel.scss'

import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import * as API from '@webapp/service/api'
import { Button } from '@webapp/components/buttons'
import { useI18n, useI18nT } from '@webapp/store/system'
import { useSurveyId } from '@webapp/store/survey'

const AiExplainPanel = ({ expression, nodeDefUuid, errorMessage, onClose }) => {
  const i18n = useI18n()
  // See AiActivityLogSummary: i18next escapes {{message}} by default,
  // which mangles quoted identifiers (e.g. Postgres column names) in
  // server-side error strings. Render this template via unescapeHtml.
  const tUnescaped = useI18nT({ unescapeHtml: true })
  const surveyId = useSurveyId()
  const cancelRef = useRef(null)

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
    const cancel = API.aiExpression.explainStream({
      surveyId,
      nodeDefUuid,
      expression,
      errorMessage,
      onChunk: (chunk) => setText((prev) => prev + chunk),
      onDone: () => setDone(true),
      onError: (err) => {
        setError(err?.message || 'unknown')
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
    <div className="ai-explain-panel" role="dialog" aria-modal="false">
      <div className="ai-explain-panel__header">
        <div className="ai-explain-panel__title">{i18n.t('aiExpression.explain.title')}</div>
        <Button className="btn-s" iconClassName="icon-close icon-14px" onClick={onCancel} title="common.close" />
      </div>

      <div className="ai-explain-panel__expression">{expression}</div>

      <div className={`ai-explain-panel__body${done ? '' : ' ai-explain-panel__cursor'}`}>
        {text || (done ? '' : i18n.t('aiExpression.explain.thinking'))}
      </div>

      {error ? (
        <div className="ai-explain-panel__error">{tUnescaped('aiExpression.explain.error', { message: error })}</div>
      ) : null}

      <div className="ai-explain-panel__buttons">
        <Button label="common.close" onClick={onCancel} />
      </div>
    </div>
  )
}

AiExplainPanel.propTypes = {
  expression: PropTypes.string.isRequired,
  nodeDefUuid: PropTypes.string,
  errorMessage: PropTypes.string,
  onClose: PropTypes.func.isRequired,
}

export default AiExplainPanel
