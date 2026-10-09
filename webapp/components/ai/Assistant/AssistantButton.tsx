import React, { useEffect } from 'react'

import { Button } from '@webapp/components/buttons'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { isAssistantShown } from './assistantAreas'
import { toggleAssistantPanel } from './assistantPanelActions'
import { useAssistantAreas } from './useAssistantAreas'
import { useAssistantPanel } from './useAssistantPanel'

/**
 * Returns true for Ctrl/Cmd + . .
 * @param {KeyboardEvent} event - Key event.
 * @returns {boolean} True for the shortcut.
 */
const isToggleShortcut = (event: KeyboardEvent): boolean => (event.ctrlKey || event.metaKey) && event.key === '.'

/**
 * Header button of the assistant (Ctrl/Cmd + . toggles the panel). Hidden when every area is hidden.
 * @returns {React.ReactElement|null} The button.
 */
export const AssistantButton = () => {
  const t = useI18nT()
  const { statuses } = useAssistantAreas()
  const { open } = useAssistantPanel()
  const shown = isAssistantShown(statuses)

  useEffect(() => {
    if (!shown) return undefined
    /**
     * Toggles the panel on the shortcut.
     * @param {KeyboardEvent} event - Key event.
     * @returns {void} Nothing.
     */
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isToggleShortcut(event)) return
      event.preventDefault()
      toggleAssistantPanel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [shown])

  if (!shown) return null

  return (
    <Button
      active={open}
      aria-expanded={open}
      aria-label={t('aiAssistant.open')}
      iconClassName="icon-magic-wand icon-16px"
      onClick={toggleAssistantPanel}
      testId={TestId.aiAssistant.openBtn}
      title="aiAssistant.open"
      variant="text"
    />
  )
}
