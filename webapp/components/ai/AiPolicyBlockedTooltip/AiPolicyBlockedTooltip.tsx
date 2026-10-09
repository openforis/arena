import React, { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router'

import type { AiFeatureAvailability } from '@webapp/ai/policy/aiFeatureAvailability'
import { appModuleUri, homeModules } from '@webapp/app/appModules'
import { TooltipNew } from '@webapp/components/TooltipNew'
import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurveyAiPolicy } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

type Props = {
  availability: AiFeatureAvailability
  children: React.ReactNode
}

/**
 * Wraps a disabled AI entry point with the reason it is blocked by the AI policy; survey administrators also get
 * a link to the AI policy tab. Renders the children unchanged when the feature is not blocked.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The children, with the tooltip when blocked.
 */
export const AiPolicyBlockedTooltip = (props: Props) => {
  const { availability, children } = props
  const i18n = useI18n()
  const navigate = useNavigate()
  const canEditPolicy = useAuthCanEditSurveyAiPolicy()

  const reasonKeys = useMemo(() => availability.reasonKeys ?? [], [availability.reasonKeys])
  // the chat is blocked by the instance ceilings: the survey tab cannot change that
  const showPolicyLink = canEditPolicy && reasonKeys.some((key) => key.startsWith('aiPolicy.blocked.'))

  const openPolicyTab = useCallback(() => {
    navigate(appModuleUri(homeModules.surveyInfo), { state: { tab: 'aiPolicy' } })
  }, [navigate])

  const renderTitle = useCallback(
    () => (
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
    ),
    [i18n, openPolicyTab, reasonKeys, showPolicyLink]
  )

  if (availability.status !== 'policyBlocked') return <>{children}</>

  return (
    <TooltipNew renderTitle={renderTitle}>
      {/* hover target: a disabled MUI button has pointer-events: none */}
      <span className="ai-policy-blocked" data-testid={TestId.ai.policyBlocked}>
        {children}
      </span>
    </TooltipNew>
  )
}
