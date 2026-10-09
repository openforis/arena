import './AiNotAvailable.scss'

import React from 'react'

import { getAiUnavailableActions } from '@webapp/ai/engines/engineUi'
import type { AiEngineFeatureAvailability } from '@webapp/ai/engines/featureAvailability'
import { Button } from '@webapp/components/buttons'
import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurveyAiPolicy } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { useAiEngineActions } from './useAiEngineActions'

type Props = {
  availability: AiEngineFeatureAvailability
}

/**
 * Why an AI feature cannot run here, with what would fix it (the mockups' "not available" panel).
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The panel.
 */
export const AiNotAvailable = (props: Props) => {
  const { availability } = props
  const i18n = useI18n()
  const canEditPolicy = useAuthCanEditSurveyAiPolicy()
  const runAction = useAiEngineActions()
  const actions = getAiUnavailableActions({
    reasons: availability.reasons,
    canChangePolicy: canEditPolicy && availability.surveyScoped,
  })

  return (
    <div className="ai-not-available" data-testid={TestId.ai.notAvailable}>
      <strong>{i18n.t('aiEngine.unavailableTitle')}</strong>
      <ul className="ai-not-available__reasons">
        {(availability.reasonKeys ?? []).map((key) => (
          <li key={key}>{i18n.t(key)}</li>
        ))}
      </ul>
      {actions.length > 0 && (
        <div className="ai-not-available__actions">
          {actions.map((action) => (
            <Button
              key={action}
              label={`aiEngine.action.${action}`}
              onClick={() => runAction(action)}
              size="small"
              testId={TestId.ai.notAvailableAction(action)}
              variant="text"
            />
          ))}
        </div>
      )}
    </div>
  )
}
