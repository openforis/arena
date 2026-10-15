import './AssistantProviderChip.scss'

import React, { useCallback, useMemo, useState } from 'react'
import classNames from 'classnames'
import Popover from '@mui/material/Popover'

import { assistantAreaFeatures } from '@webapp/ai/agent/runAssistantTurn'
import { getConversationDataClass } from '@webapp/ai/conversations/dataClass'
import type { Conversation } from '@webapp/ai/conversations/types'
import { refreshAiCapabilities } from '@webapp/ai/engines/capabilitiesStore'
import { getAiEngineFeatureAvailability } from '@webapp/ai/engines/featureAvailability'
import { useAiEngineActions } from '@webapp/components/ai/AiNotAvailable/useAiEngineActions'
import { useAiFeaturePolicy } from '@webapp/components/ai/hooks/useAiFeatureAvailability'
import { invalidateAiSettingsCache } from '@webapp/components/ai/hooks/useAiFeatureEnabled'
import { ProviderMonogram } from '@webapp/components/ai/ProviderMonogram/ProviderMonogram'
import { getApiErrorMessage, type TFunction } from '@webapp/components/ai/UserAiSettingsPanel/aiSettingsForm'
import {
  getProviderDisplayName,
  getProviderMonogramType,
  getProviderWhereKey,
} from '@webapp/components/ai/UserAiSettingsPanel/providerList'
import { useNotifyError } from '@webapp/components/hooks'
import { setDefaultProvider } from '@webapp/service/api/ai/providers'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import type { AssistantArea } from '../assistantAreas'
import {
  buildProviderChoices,
  getConversationProvider,
  getProviderChipLabel,
  getProviderChipView,
  type ProviderChoice,
} from './providerChipModel'

// icon of where the provider runs (same icons as the old data-location badge)
const iconByWhereKey: Record<string, string> = {
  onDevice: 'icon-laptop',
  orgHosted: 'icon-office',
  cloud: 'icon-cloud',
  cloudOwnKey: 'icon-cloud',
}

type Props = {
  area: AssistantArea
  conversation: Conversation | null
  // provider stored with the conversation (or picked in the blank chat)
  providerId: string | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onChoose: (providerId: string) => void
  // a turn is running: its provider can't change
  disabled: boolean
}

/**
 * One row of the "Answer with" popover: radio, monogram, name and model, where it runs (or why it is blocked).
 * @param {object} props - Props.
 * @param {ProviderChoice} props.choice - Row.
 * @param {Function} props.onChoose - Called with the provider id.
 * @param {TFunction} props.t - Translation function.
 * @returns {React.ReactElement} The row.
 */
const ProviderChoiceRow = ({
  choice,
  onChoose,
  t,
}: {
  choice: ProviderChoice
  onChoose: (providerId: string) => void
  t: TFunction
}) => {
  const { entry, selected, isDefault, disabled, reasonKey, whereKey } = choice
  const details = [
    whereKey ? t(`userAiSettings:where.${whereKey}`) : null,
    isDefault ? t('aiAssistant.providerChip.isDefault') : null,
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <button
      aria-checked={selected}
      // not `disabled`: a blocked row stays focusable so its reason is read out
      aria-disabled={disabled}
      className={classNames('ai-provider-chooser__row', {
        'ai-provider-chooser__row--selected': selected,
        'ai-provider-chooser__row--blocked': disabled,
      })}
      data-testid={TestId.aiAssistant.providerChoice(entry.id)}
      onClick={() => {
        if (!disabled) onChoose(entry.id)
      }}
      role="radio"
      type="button"
    >
      <span aria-hidden="true" className="ai-provider-chooser__radio" />
      <ProviderMonogram small type={getProviderMonogramType(entry)} />
      <span className="ai-provider-chooser__text">
        <span>
          <b>{getProviderDisplayName({ entry, t })}</b>
          {entry.model ? ` · ${entry.model}` : ''}
        </span>
        {reasonKey ? <small className="ai-provider-chooser__reason">{t(reasonKey)}</small> : <small>{details}</small>}
      </span>
    </button>
  )
}

/**
 * Provider chip of the composer: the provider of the conversation, and the "Answer with" popover to pick another one.
 * @param {Props} props - Props.
 * @returns {React.ReactElement|null} The chip, or null while the area's feature is off or loading.
 */
export const AssistantProviderChip = (props: Props) => {
  const { area, conversation, providerId, open, onOpenChange, onChoose, disabled } = props
  const t = useI18nT({ unescapeHtml: true })
  const notifyError = useNotifyError()
  const runAction = useAiEngineActions()
  // a callback ref (state): the popover is anchored once the chip is mounted
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null)
  const [makeDefault, setMakeDefault] = useState(false)
  const { enabled, effective, surveyScoped, capabilities, requestDataClass } = useAiFeaturePolicy(
    assistantAreaFeatures[area],
    { dataClass: area === 'analysis' ? getConversationDataClass(conversation) : undefined }
  )
  const current = getConversationProvider({ capabilities, providerId })
  const availability = useMemo(
    () =>
      getAiEngineFeatureAvailability({
        enabled,
        effective,
        dataClass: requestDataClass,
        surveyScoped,
        capabilities,
        providerId,
      }),
    [capabilities, effective, enabled, providerId, requestDataClass, surveyScoped]
  )
  const choices = useMemo(
    () =>
      buildProviderChoices({
        capabilities,
        effective,
        dataClass: requestDataClass,
        surveyScoped,
        selectedId: current.providerId,
      }),
    [capabilities, current.providerId, effective, requestDataClass, surveyScoped]
  )

  /**
   * Closes the popover.
   * @returns {void} Nothing.
   */
  const close = useCallback(() => onOpenChange(false), [onOpenChange])

  /**
   * Picks a provider for the conversation, and saves it as the default when asked.
   * @param {string} id - Provider id.
   * @returns {Promise<void>} Resolves when done.
   */
  const choose = useCallback(
    async (id: string) => {
      onChoose(id)
      close()
      if (!makeDefault) return
      try {
        await setDefaultProvider({ providerId: id })
        // the settings cache and the capabilities hold the default: read again
        invalidateAiSettingsCache()
        await refreshAiCapabilities()
      } catch (error) {
        notifyError({
          key: 'aiAssistant.providerChip.defaultFailed',
          params: { message: getApiErrorMessage({ error, t }) },
        })
      }
    },
    [close, makeDefault, notifyError, onChoose, t]
  )

  /**
   * Opens the provider settings.
   * @returns {void} Nothing.
   */
  const manage = useCallback(() => {
    close()
    void runAction('openSettings')
  }, [close, runAction])

  if (availability.status === 'disabled') return null

  const view = getProviderChipView({ capabilities, current, status: availability.status })
  if (view.kind === 'none') {
    return (
      <button
        className="ai-provider-chip ai-provider-chip--none"
        data-testid={TestId.aiAssistant.providerChip}
        onClick={manage}
        type="button"
      >
        <span className="ai-provider-chip__text">{t('aiAssistant.providerChip.none')}</span>
      </button>
    )
  }
  const label =
    view.kind === 'provider' ? getProviderChipLabel({ entry: view.entry, t }) : t('aiAssistant.providerChip.missing')
  // where the provider runs is part of the accessible name and the tooltip, not of the visible text
  const whereKey = view.kind === 'provider' ? getProviderWhereKey(view.entry) : null
  const fullLabel = whereKey ? `${label} · ${t(`userAiSettings:where.${whereKey}`)}` : label
  const tone = view.kind === 'provider' ? view.tone : 'bad'
  // a default missing on this browser is a local provider of another computer
  const iconClass = whereKey ? iconByWhereKey[whereKey] : 'icon-laptop'

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t('aiAssistant.providerChip.title', { name: fullLabel })}
        className={`ai-provider-chip ai-provider-chip--${tone}`}
        data-testid={TestId.aiAssistant.providerChip}
        disabled={disabled}
        onClick={() => onOpenChange(!open)}
        ref={setAnchor}
        title={fullLabel}
        type="button"
      >
        <span aria-hidden="true" className={`ai-provider-chip__icon icon ${iconClass} icon-14px`} />
        <span aria-hidden="true" className="ai-provider-chip__caret">
          ▾
        </span>
      </button>
      <Popover
        anchorEl={anchor}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        onClose={close}
        open={open && anchor !== null}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <div
          aria-label={t('aiAssistant.providerChip.answerWith')}
          className="ai-provider-chooser"
          data-testid={TestId.aiAssistant.providerChooser}
          role="dialog"
        >
          <span className="ai-provider-chooser__title">{t('aiAssistant.providerChip.answerWith')}</span>
          <div
            aria-label={t('aiAssistant.providerChip.answerWith')}
            className="ai-provider-chooser__rows"
            role="radiogroup"
          >
            {choices.map((choice) => (
              <ProviderChoiceRow choice={choice} key={choice.entry.id} onChoose={choose} t={t} />
            ))}
          </div>
          <div className="ai-provider-chooser__footer">
            <label className="ai-provider-chooser__default">
              <input
                checked={makeDefault}
                data-testid={TestId.aiAssistant.providerMakeDefault}
                onChange={(event) => setMakeDefault(event.target.checked)}
                type="checkbox"
              />
              {t('aiAssistant.providerChip.makeDefault')}
            </label>
            <button
              className="ai-provider-chooser__manage"
              data-testid={TestId.aiAssistant.providerManage}
              onClick={manage}
              type="button"
            >
              {t('aiAssistant.providerChip.manage')}
            </button>
          </div>
        </div>
      </Popover>
    </>
  )
}
