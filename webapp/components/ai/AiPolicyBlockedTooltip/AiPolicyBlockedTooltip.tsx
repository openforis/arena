import React, { useCallback, useId, useMemo } from 'react'
import { useNavigate } from 'react-router'

import type { AiEngineFeatureAvailability } from '@webapp/ai/engines/featureAvailability'
import type { AiFeatureAvailability } from '@webapp/ai/policy/aiFeatureAvailability'
import { appModuleUri, homeModules } from '@webapp/app/appModules'
import { AiNotAvailable } from '@webapp/components/ai/AiNotAvailable'
import { TooltipNew } from '@webapp/components/TooltipNew'
import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurveyAiPolicy } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

const visuallyHidden: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
}

type Props = {
  availability: AiFeatureAvailability
  children: React.ReactNode
}

/**
 * Wraps a disabled AI entry point with the reason it is blocked: the AI policy (with a link to the tab for survey
 * administrators), or no engine (the reasons, each with an action). Renders the children unchanged otherwise.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The children, with the tooltip when blocked.
 */
export const AiPolicyBlockedTooltip = (props: Props) => {
  const { availability, children } = props
  const i18n = useI18n()
  const navigate = useNavigate()
  const reasonId = useId()
  const canEditPolicy = useAuthCanEditSurveyAiPolicy()

  const reasonKeys = useMemo(() => availability.reasonKeys ?? [], [availability.reasonKeys])
  // the chat is blocked by the instance ceilings: the survey tab cannot change that
  const showPolicyLink = canEditPolicy && reasonKeys.some((key) => key.startsWith('aiPolicy.blocked.'))

  const openPolicyTab = useCallback(() => {
    navigate(appModuleUri(homeModules.surveyInfo), { state: { tab: 'aiPolicy' } })
  }, [navigate])

  const renderTitle = useCallback(() => {
    if (availability.status === 'noEngine') {
      // C's reasons and actions (the availability hook returns AiEngineFeatureAvailability)
      return <AiNotAvailable availability={availability as AiEngineFeatureAvailability} />
    }
    return (
      <div className="ai-policy-blocked-tooltip" data-testid={TestId.ai.policyBlockedTooltip}>
        {reasonKeys.map((key) => (
          <p key={key}>{i18n.t(key)}</p>
        ))}
        {showPolicyLink && (
          <button
            type="button"
            className="btn-transparent"
            onClick={openPolicyTab}
            data-testid={TestId.ai.openPolicyTabBtn}
          >
            {i18n.t('aiPolicy.openPolicyTab')}
          </button>
        )}
      </div>
    )
  }, [availability, i18n, openPolicyTab, reasonKeys, showPolicyLink])

  if (availability.status !== 'policyBlocked' && availability.status !== 'noEngine') return <>{children}</>

  return (
    <TooltipNew renderTitle={renderTitle}>
      {/* hover target: a disabled button (MUI or native, e.g. the chat FAB) does not reliably receive hover itself */}
      <span
        className="ai-policy-blocked"
        data-testid={TestId.ai.policyBlocked}
        tabIndex={0}
        aria-describedby={reasonId}
      >
        {children}
        <span id={reasonId} style={visuallyHidden}>
          {reasonKeys.map((key) => i18n.t(key)).join(' ')}
        </span>
      </span>
    </TooltipNew>
  )
}
