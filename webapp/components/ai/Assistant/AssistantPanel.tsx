import './Assistant.scss'

import React, { useCallback, useEffect, useRef } from 'react'

import { assistantAreaFeatures } from '@webapp/ai/agent/runAssistantTurn'
import { getConversationDataClass } from '@webapp/ai/conversations/dataClass'
import { AiFeatureDataLocationBadge } from '@webapp/components/ai/AiDataLocationBadge'
import { AiNotAvailable } from '@webapp/components/ai/AiNotAvailable'
import { ButtonIconClose, ButtonMenu } from '@webapp/components/buttons'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { RecordDataSharedNote } from './analysis/RecordDataSharedNote'
import { AssistantChat } from './AssistantChat'
import { AssistantHistory } from './AssistantHistory'
import type { AssistantArea, AssistantAreaStatus } from './assistantAreas'
import { closeAssistantPanel } from './assistantPanelActions'
import { assistantPanelStore, type AssistantPanelView } from './assistantPanelStore'
import { useAssistantConversation, type AssistantConversationApi } from './useAssistantConversation'
import { useAssistantPanel } from './useAssistantPanel'

// D3 adds cleaning (the Record type makes a missing area a type error)
const areaTabLabelKeys: Record<AssistantArea, string> = {
  design: 'aiAssistant.tabs.design',
  analysis: 'aiAnalysis.area',
  help: 'aiAssistant.tabs.help',
}

/**
 * Area tabs (disabled while an answer runs).
 * @param {object} props - Props.
 * @param {AssistantAreaStatus[]} props.statuses - Area statuses.
 * @param {AssistantArea} props.area - Current area.
 * @param {boolean} props.busy - An answer is running.
 * @returns {React.ReactElement} The tabs.
 */
const AssistantTabs = ({
  statuses,
  area,
  busy,
}: {
  statuses: AssistantAreaStatus[]
  area: AssistantArea
  busy: boolean
}) => {
  const t = useI18nT()
  return (
    <div className="ai-assistant-panel__tabs" role="tablist">
      {statuses
        .filter((status) => status.status !== 'hidden')
        .map(({ area: tabArea }) => (
          <button
            aria-selected={tabArea === area}
            className="ai-assistant-panel__tab"
            data-testid={TestId.aiAssistant.tab(tabArea)}
            disabled={busy}
            key={tabArea}
            onClick={() => assistantPanelStore.setArea(tabArea, { byUser: true })}
            role="tab"
            type="button"
          >
            {t(areaTabLabelKeys[tabArea])}
          </button>
        ))}
    </div>
  )
}

/**
 * Panel menu: new conversation, history, clear.
 * @param {object} props - Props.
 * @param {AssistantConversationApi} props.api - Conversation state and actions.
 * @returns {React.ReactElement} The menu.
 */
const AssistantMenu = ({ api }: { api: AssistantConversationApi }) => (
  <ButtonMenu
    className="btn-s"
    disabled={api.busy}
    iconClassName="icon-menu icon-12px"
    items={[
      {
        key: 'newConversation',
        label: 'aiAssistant.menu.newConversation',
        onClick: api.newConversation,
        testId: TestId.aiAssistant.newConversationBtn,
      },
      {
        key: 'history',
        label: 'aiAssistant.menu.history',
        onClick: assistantPanelStore.showHistory,
        testId: TestId.aiAssistant.historyBtn,
      },
      {
        key: 'clear',
        label: 'aiAssistant.menu.clear',
        onClick: () => void api.clearConversations(),
        testId: TestId.aiAssistant.clearBtn,
      },
    ]}
    testId={TestId.aiAssistant.menuBtn}
    title="aiAssistant.menu.label"
  />
)

/**
 * Chat, history, or the reasons why the area is unavailable.
 * @param {object} props - Props.
 * @param {AssistantAreaStatus|undefined} props.status - Status of the area.
 * @param {AssistantPanelView} props.view - Chat or history.
 * @param {AssistantArea} props.area - Current area.
 * @param {AssistantConversationApi} props.api - Conversation state and actions.
 * @returns {React.ReactElement} The body.
 */
const AssistantBody = ({
  status,
  view,
  area,
  api,
}: {
  status: AssistantAreaStatus | undefined
  view: AssistantPanelView
  area: AssistantArea
  api: AssistantConversationApi
}) => {
  const t = useI18nT({ unescapeHtml: true })
  if (status?.engineAvailability && status.status !== 'available') {
    // the reasons with their actions (turn on the local server, choose a model, change the policy, retry)
    return (
      <div className="ai-assistant-panel__unavailable" data-testid={TestId.aiAssistant.unavailable}>
        <AiNotAvailable availability={status.engineAvailability} />
      </div>
    )
  }
  if (status?.status !== 'available') {
    return (
      <div className="ai-assistant-panel__unavailable" data-testid={TestId.aiAssistant.unavailable}>
        {(status?.reasonKeys ?? []).map((key) => (
          <p key={key}>{t(key)}</p>
        ))}
      </div>
    )
  }
  if (view === 'history') return <AssistantHistory api={api} />
  return <AssistantChat api={api} area={area} />
}

/**
 * The assistant panel: a non-modal dialog docked on the right (lazy loaded).
 * @param {object} props - Props.
 * @param {AssistantAreaStatus[]} props.statuses - Area statuses.
 * @returns {React.ReactElement} The panel.
 */
const AssistantPanel = ({ statuses }: { statuses: AssistantAreaStatus[] }) => {
  const t = useI18nT()
  const { open, area: selectedArea, conversationId, view } = useAssistantPanel()
  const area: AssistantArea = selectedArea ?? 'help'
  const api = useAssistantConversation({ area, conversationId })
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.show()
    if (!open && dialog.open) dialog.close()
  }, [open])

  /**
   * Esc closes the panel.
   * @param {React.KeyboardEvent} event - Key event.
   * @returns {void} Nothing.
   */
  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key !== 'Escape') return
    event.stopPropagation()
    closeAssistantPanel()
  }, [])

  return (
    <dialog
      aria-label={t('aiAssistant.title')}
      className="ai-assistant-panel"
      data-busy={String(api.busy)}
      data-testid={TestId.aiAssistant.panel}
      onKeyDown={onKeyDown}
      ref={dialogRef}
    >
      <div className="ai-assistant-panel__header">
        <h2 className="ai-assistant-panel__title">{t('aiAssistant.title')}</h2>
        <AiFeatureDataLocationBadge
          compact
          dataClass={area === 'analysis' ? getConversationDataClass(api.conversation) : undefined}
          feature={assistantAreaFeatures[area]}
        />
        <RecordDataSharedNote conversation={api.conversation} />
        <AssistantMenu api={api} />
        <ButtonIconClose label="aiAssistant.close" onClick={closeAssistantPanel} testId={TestId.aiAssistant.closeBtn} />
      </div>
      <AssistantTabs area={area} busy={api.busy} statuses={statuses} />
      <AssistantBody api={api} area={area} status={statuses.find((item) => item.area === area)} view={view} />
    </dialog>
  )
}

export default AssistantPanel
