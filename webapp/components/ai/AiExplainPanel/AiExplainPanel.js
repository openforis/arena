import './AiExplainPanel.scss'

import { useCallback, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import { AiWorkflows, getAiErrorKey, getAiErrorMessage } from '@webapp/ai/workflows'
import { AiEngineErrorActions } from '@webapp/components/ai/AiNotAvailable'
import { AiFeatureDataLocationBadge } from '@webapp/components/ai/AiDataLocationBadge'
import { Modal, ModalBody } from '@webapp/components/modal'
import { AssistantMarkdown } from '@webapp/components/ai/Assistant/AssistantMarkdown'
import { useAiTextStream } from '@webapp/components/ai/hooks/useAiTextStream'
import { useI18n, useI18nT } from '@webapp/store/system'
import { useSurvey, useSurveyId } from '@webapp/store/survey'

const AiExplainPanel = ({ expression, nodeDefUuid, onClose }) => {
  const i18n = useI18n()
  // See AiActivityLogSummary: i18next escapes {{message}} by default,
  // which mangles quoted identifiers (e.g. Postgres column names) in
  // server-side error strings. Render this template via unescapeHtml.
  const tUnescaped = useI18nT({ unescapeHtml: true })
  const survey = useSurvey()
  const surveyId = useSurveyId()
  // read the latest survey at call time: a store update must not restart the stream
  const surveyRef = useRef(survey)
  useEffect(() => {
    surveyRef.current = survey
  }, [survey])

  const start = useCallback(
    (callbacks) =>
      AiWorkflows.explainExpression({ survey: surveyRef.current, surveyId, nodeDefUuid, expression, ...callbacks }),
    [surveyId, nodeDefUuid, expression]
  )
  const { text, done, error, onRetry, cancel } = useAiTextStream({ start, onClose })

  const onCancel = () => {
    cancel()
    onClose()
  }

  return (
    <Modal className="ai-explain-panel" title="aiExpression.explain.title" showCloseButton onClose={onCancel}>
      <ModalBody>
        <AiFeatureDataLocationBadge feature="expressionExplain" />
        <div className="ai-explain-panel__expression">{expression}</div>

        <div className={`ai-explain-panel__body${done ? '' : ' ai-explain-panel__cursor'}`}>
          {text && <AssistantMarkdown text={text} />}
          {!text && !done && i18n.t('aiExpression.explain.thinking')}
        </div>

        {error ? (
          <div className="ai-explain-panel__error">
            {getAiErrorKey(error) === 'aiRequestTimeout'
              ? i18n.t('aiExpression.explain.timeout')
              : tUnescaped('aiExpression.explain.error', { message: getAiErrorMessage({ error, i18n }) })}
            <AiEngineErrorActions error={error} onRetry={onRetry} />
          </div>
        ) : null}
      </ModalBody>
    </Modal>
  )
}

AiExplainPanel.propTypes = {
  expression: PropTypes.string.isRequired,
  nodeDefUuid: PropTypes.string,
  onClose: PropTypes.func.isRequired,
}

export default AiExplainPanel
