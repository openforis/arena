import './Assistant.scss'

import React, { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'

import { appModuleUri, userModules } from '@webapp/app/appModules'
import { AiNotAvailable } from '@webapp/components/ai/AiNotAvailable'
import { ButtonIconAdd, ButtonIconClose, ButtonMenu } from '@webapp/components/buttons'
import { useConfirm, useNotifyError } from '@webapp/components/hooks'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'
import type { AssistantSuggestion } from '@webapp/ai/suggestions/types'

import { AssistantChat } from './AssistantChat'
import { AssistantHistory } from './AssistantHistory'
import { AssistantStartScreen } from './AssistantStartScreen'
import { AssistantSuggestionList } from './AssistantSuggestionList'
import type { AssistantArea, AssistantAreaStatus } from './assistantAreas'
import { closeAssistantPanel } from './assistantPanelActions'
import { assistantPanelStore, type AssistantPanelView } from './assistantPanelStore'
import { useAssistantConversation, type AssistantConversationApi } from './useAssistantConversation'
import { useAssistantPanel } from './useAssistantPanel'
import type { SuggestionsByArea } from './suggestions/suggestionsModel'
import { useVisibleSuggestions } from './suggestions/useVisibleSuggestions'

// the Record type makes a missing area a type error
const areaTabLabelKeys: Record<AssistantArea, string> = {
  design: 'aiAssistant.tabs.design',
  analysis: 'aiAnalysis.area',
  cleaning: 'aiCleaning.area',
  help: 'aiAssistant.tabs.help',
}

/**
 * Area tabs (disabled while an answer runs); a dot marks the tabs with suggestions.
 * @param {object} props - Props.
 * @param {AssistantAreaStatus[]} props.statuses - Area statuses.
 * @param {AssistantArea} props.area - Current area.
 * @param {boolean} props.busy - An answer is running.
 * @param {SuggestionsByArea} props.byArea - Visible suggestions of each area.
 * @returns {React.ReactElement} The tabs.
 */
const AssistantTabs = ({
  statuses,
  area,
  busy,
  byArea,
}: {
  statuses: AssistantAreaStatus[]
  area: AssistantArea
  busy: boolean
  byArea: SuggestionsByArea
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
            {(byArea[tabArea]?.length ?? 0) > 0 && (
              // the button's label reads the count; the tab keeps its name
              <span
                aria-hidden="true"
                className="ai-assistant-panel__tab-dot"
                data-testid={TestId.aiAssistant.tabDot}
              />
            )}
          </button>
        ))}
    </div>
  )
}

/**
 * Panel menu: the user's AI settings and the guarded delete of every conversation.
 * @param {object} props - Props.
 * @param {AssistantConversationApi} props.api - Conversation state and actions.
 * @returns {React.ReactElement} The menu.
 */
const AssistantMenu = ({ api }: { api: AssistantConversationApi }) => {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const notifyError = useNotifyError()
  return (
    <ButtonMenu
      className="btn-s"
      disabled={api.busy}
      icon={<MoreHorizIcon fontSize="small" />}
      items={[
        {
          key: 'aiSettings',
          iconClassName: 'icon-cog icon-12px',
          label: 'aiAssistant.menu.aiSettings',
          // own profile: the AI settings panel (as the not-available actions do)
          onClick: () => navigate(appModuleUri(userModules.user)),
          testId: TestId.aiAssistant.aiSettingsBtn,
        },
        {
          key: 'deleteAll',
          className: 'ai-assistant-panel__menu-danger',
          iconClassName: 'icon-bin2 icon-12px',
          label: 'aiAssistant.menu.deleteAll',
          // onCancel is required by useConfirm's inferred (untyped) parameter
          onClick: () =>
            confirm({
              key: 'aiAssistant.deleteAllConfirm',
              onOk: () =>
                void api.clearConversations().catch(() => notifyError({ key: 'aiAssistant.deleteAllFailed' })),
              onCancel: undefined,
            }),
          testId: TestId.aiAssistant.deleteAllBtn,
        },
      ]}
      showCaret={false}
      testId={TestId.aiAssistant.menuBtn}
      title="aiAssistant.menu.label"
    />
  )
}

/**
 * Home page, chat, conversation or suggestion list, or the reasons why the area is unavailable.
 * @param {object} props - Props.
 * @param {AssistantAreaStatus|undefined} props.status - Status of the area.
 * @param {AssistantPanelView} props.view - Home, chat or one of the lists.
 * @param {AssistantArea} props.area - Current area.
 * @param {AssistantConversationApi} props.api - Conversation state and actions.
 * @param {AssistantSuggestion[]} props.suggestions - Visible suggestions of the area.
 * @returns {React.ReactElement} The body.
 */
const AssistantBody = ({
  status,
  view,
  area,
  api,
  suggestions,
}: {
  status: AssistantAreaStatus | undefined
  view: AssistantPanelView
  area: AssistantArea
  api: AssistantConversationApi
  suggestions: AssistantSuggestion[]
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
  switch (view) {
    case 'home':
      return <AssistantStartScreen api={api} area={area} suggestions={suggestions} />
    case 'history':
      return <AssistantHistory api={api} />
    case 'suggestions':
      return <AssistantSuggestionList api={api} suggestions={suggestions} />
    default:
      return <AssistantChat api={api} area={area} />
  }
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
  const { byArea } = useVisibleSuggestions()
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
        <ButtonIconAdd
          disabled={api.busy}
          label="aiAssistant.menu.newConversation"
          onClick={api.newConversation}
          size="small"
          testId={TestId.aiAssistant.newConversationBtn}
        />
        <AssistantMenu api={api} />
        <ButtonIconClose label="aiAssistant.close" onClick={closeAssistantPanel} testId={TestId.aiAssistant.closeBtn} />
      </div>
      <AssistantTabs area={area} busy={api.busy} byArea={byArea} statuses={statuses} />
      <AssistantBody
        api={api}
        area={area}
        status={statuses.find((item) => item.area === area)}
        suggestions={byArea[area] ?? []}
        view={view}
      />
    </dialog>
  )
}

export default AssistantPanel
