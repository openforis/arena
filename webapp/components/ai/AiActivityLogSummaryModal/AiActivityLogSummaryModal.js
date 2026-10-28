import './AiActivityLogSummaryModal.scss'

import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import { AiWorkflows, getAiErrorMessage } from '@webapp/ai/workflows'
import { AiEngineErrorActions } from '@webapp/components/ai/AiNotAvailable'
import { AiFeatureDataLocationBadge } from '@webapp/components/ai/AiDataLocationBadge'
import { Modal, ModalBody } from '@webapp/components/modal'
import { AssistantMarkdown } from '@webapp/components/ai/Assistant/AssistantMarkdown'
import { useAiTextStream } from '@webapp/components/ai/hooks/useAiTextStream'
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

  const start = useCallback(
    (callbacks) => AiWorkflows.summarizeActivityLog({ surveyId, surveyName, ...callbacks }),
    [surveyId, surveyName]
  )
  const { text, done, error, onRetry, cancel } = useAiTextStream({ start, onClose, enabled: Boolean(surveyId) })

  const onCancel = () => {
    cancel()
    onClose()
  }

  const bodyContent = useMemo(() => {
    if (text) {
      return <AssistantMarkdown text={text} />
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
