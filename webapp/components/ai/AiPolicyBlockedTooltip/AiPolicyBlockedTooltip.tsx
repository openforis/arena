import './AiPolicyBlockedTooltip.scss'

import React, { useCallback, useId, useMemo, useReducer, useState } from 'react'
import { Paper, Popper } from '@mui/material'
import { useNavigate } from 'react-router'

import type { AiEngineFeatureAvailability } from '@webapp/ai/engines/featureAvailability'
import type { AiFeatureAvailability } from '@webapp/ai/policy/aiFeatureAvailability'
import { appModuleUri, homeModules } from '@webapp/app/appModules'
import { AiNotAvailable } from '@webapp/components/ai/AiNotAvailable'
import { TooltipNew } from '@webapp/components/TooltipNew'
import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurveyAiPolicy } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { initialReasonsState, isReasonsPopupOpen, reduceReasons } from './reasonsPopupModel'

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
 * Tells whether an element has the focus because of the keyboard (a click doesn't show the reasons panel).
 * @param {EventTarget} target - Element that got the focus.
 * @returns {boolean} True for keyboard focus (also when the browser can't tell).
 */
const hasKeyboardFocus = (target: EventTarget): boolean => {
  try {
    return (target as Element).matches(':focus-visible')
  } catch {
    return true
  }
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
  // the control the reasons open under (state: the popper reads it while rendering)
  const [target, setTarget] = useState<HTMLSpanElement | null>(null)
  const [popup, setPopup] = useState<HTMLElement | null>(null)
  // keyboard users: the reasons and their actions open below the control (a tooltip can't be tabbed into)
  const [reasons, dispatchReasons] = useReducer(reduceReasons, initialReasonsState)
  const popupOpen = isReasonsPopupOpen(reasons)

  const reasonKeys = useMemo(() => availability.reasonKeys ?? [], [availability.reasonKeys])
  // the chat is blocked by the instance ceilings: the survey tab cannot change that
  const showPolicyLink = canEditPolicy && reasonKeys.some((key) => key.startsWith('aiPolicy.blocked.'))

  const openPolicyTab = useCallback(() => {
    navigate(appModuleUri(homeModules.surveyInfo), { state: { tab: 'aiPolicy' } })
  }, [navigate])

  const renderTitle = useCallback(() => {
    if (availability.status === 'noEngine') {
      // the reasons and actions (the availability hook returns AiEngineFeatureAvailability)
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

  const onFocus = useCallback((event: React.FocusEvent) => {
    dispatchReasons({ type: 'focus', keyboard: hasKeyboardFocus(event.target) })
  }, [])

  const onBlur = useCallback(
    (event: React.FocusEvent) => {
      // the focus moves between the control and the actions below it
      const next = event.relatedTarget as Node | null
      const toInside = next !== null && (Boolean(target?.contains(next)) || Boolean(popup?.contains(next)))
      dispatchReasons({ type: 'blur', toInside })
    },
    [popup, target]
  )

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key !== 'Escape' || !popupOpen) return
      // closes the reasons, not the assistant panel behind
      event.stopPropagation()
      dispatchReasons({ type: 'escape' })
      target?.focus()
    },
    [popupOpen, target]
  )

  if (availability.status !== 'policyBlocked' && availability.status !== 'noEngine') return <>{children}</>

  return (
    <>
      {/* the hover tooltip and the keyboard reasons never show together */}
      <TooltipNew disableFocusListener renderTitle={renderTitle} suppressed={popupOpen}>
        {/* hover target: a disabled button (MUI or native, e.g. the chat FAB) does not reliably receive hover itself */}
        <span
          aria-describedby={reasonId}
          className="ai-policy-blocked"
          data-testid={TestId.ai.policyBlocked}
          onBlur={onBlur}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          ref={setTarget}
          tabIndex={0}
        >
          {children}
          <span id={reasonId} style={visuallyHidden}>
            {reasonKeys.map((key) => i18n.t(key)).join(' ')}
          </span>
        </span>
      </TooltipNew>
      {popupOpen && (
        // rendered in place (no portal), after the control, so Tab goes from the control to the actions; a sibling,
        // because the reasons are block content and the control is an inline span
        <Popper anchorEl={target} disablePortal open placement="bottom-start" sx={{ zIndex: 'tooltip' }}>
          <Paper
            className="ai-policy-blocked__reasons"
            elevation={4}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            ref={setPopup}
          >
            {renderTitle()}
          </Paper>
        </Popper>
      )}
    </>
  )
}
