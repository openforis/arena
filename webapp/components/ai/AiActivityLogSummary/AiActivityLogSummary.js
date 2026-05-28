import './AiActivityLogSummary.scss'

import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import * as API from '@webapp/service/api'
import { Button } from '@webapp/components/buttons'
import { useI18n, useI18nT } from '@webapp/store/system'
import { useSurveyId } from '@webapp/store/survey'

const AiActivityLogSummary = ({ from, to, userUuid, onClose }) => {
  const i18n = useI18n()
  // Server-side error messages may contain quoted identifiers (Postgres
  // column names, etc.) which i18next escapes by default — appears as
  // &quot; in the rendered panel. Render the {{message}}-bearing template
  // through unescapeHtml.
  const tUnescaped = useI18nT({ unescapeHtml: true })
  const surveyId = useSurveyId()
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
    const cancel = API.aiActivityLog.summarizeStream({
      surveyId,
      from,
      to,
      userUuid,
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
  }, [surveyId, from, to, userUuid])

  const onCancel = () => {
    cancelRef.current?.()
    onClose()
  }

  return (
    <div className="ai-activity-log-summary" role="dialog" aria-modal="false">
      <div className="ai-activity-log-summary__header">
        <div className="ai-activity-log-summary__title">{i18n.t('aiActivityLog.title')}</div>
        <Button className="btn-s" iconClassName="icon-cross icon-14px" onClick={onCancel} title="common.close" />
      </div>

      <div className={`ai-activity-log-summary__body${done ? '' : ' ai-activity-log-summary__cursor'}`}>
        {text || (done ? '' : i18n.t('aiActivityLog.thinking'))}
      </div>

      {error ? (
        <div className="ai-activity-log-summary__error">{tUnescaped('aiActivityLog.error', { message: error })}</div>
      ) : null}

      <div className="ai-activity-log-summary__buttons">
        <Button label="common.close" onClick={onCancel} />
      </div>
    </div>
  )
}

AiActivityLogSummary.propTypes = {
  from: PropTypes.string,
  to: PropTypes.string,
  userUuid: PropTypes.string,
  onClose: PropTypes.func.isRequired,
}

export default AiActivityLogSummary
