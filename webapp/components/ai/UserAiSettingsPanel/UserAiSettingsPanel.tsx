import './UserAiSettingsPanel.scss'

import React, { useEffect, useImperativeHandle } from 'react'

import { Fieldset } from '@webapp/components/Fieldset'

import { AiAccessLevel } from './AiAccessLevel'
import { AiEngineOrder } from './AiEngineOrder'
import { AiEngineStatusLine } from './AiEngineStatusLine'
import { CloudProviderSection } from './CloudProviderSection'
import { LocalAiSection } from './LocalAiSection'
import { type UseUserAiSettingsResult, useUserAiSettings } from './useUserAiSettings'

type UserAiSettingsPanelProps = {
  onDirtyChange?: ((dirty: boolean) => void) | null
}

type SectionsProps = {
  panel: UseUserAiSettingsResult
}

/**
 * Sections shown when AI can see something: Where AI runs, then the footer note.
 * @param {SectionsProps} props - Props.
 * @returns {React.ReactElement} The sections.
 */
const PanelSections = ({ panel }: SectionsProps) => {
  const { local } = panel
  return (
    <>
      <Fieldset className="user-ai-settings-panel__section" legend="userAiSettings:where.section">
        <AiEngineStatusLine status={panel.engineStatus} />
        <LocalAiSection local={local} />
        <CloudProviderSection panel={panel} />
        {local.draft.enabled && <AiEngineOrder preferLocal={local.draft.preferLocal} onChange={local.setPreferLocal} />}
      </Fieldset>
      <div className="user-ai-settings-panel__footer-note">{panel.i18n.t('userAiSettings:footerNote')}</div>
    </>
  )
}

/**
 * AI panel of the User Profile page. The parent's Save calls the function exposed by the ref.
 */
const UserAiSettingsPanel = React.forwardRef<() => Promise<void>, UserAiSettingsPanelProps>(
  ({ onDirtyChange = null }, ref) => {
    const panel = useUserAiSettings()
    const { i18n, loading, settings, form, dirty, onSave } = panel

    useImperativeHandle(ref, () => onSave, [onSave])

    useEffect(() => {
      onDirtyChange?.(dirty)
    }, [dirty, onDirtyChange])

    if (loading || !settings) return null

    if (settings.aiFeaturesDisabled) {
      return (
        <Fieldset className="user-ai-settings-panel" legend="userAiSettings:section">
          <div className="user-ai-settings-panel__status user-ai-settings-panel__status--missing">
            {i18n.t('userAiSettings:featuresDisabled')}
          </div>
        </Fieldset>
      )
    }

    return (
      <Fieldset className="user-ai-settings-panel" legend="userAiSettings:section">
        {!settings.encryptionConfigured && (
          <div className="user-ai-settings-panel__status user-ai-settings-panel__status--missing">
            {i18n.t('userAiSettings:encryptionMissing')}
          </div>
        )}
        <AiAccessLevel
          accessLevel={form.accessLevel}
          toggles={form.featureToggles}
          onLevelChange={panel.onAccessLevelChange}
          onToggleChange={panel.onFeatureToggleChange}
        />
        {form.accessLevel > 0 && <PanelSections panel={panel} />}
      </Fieldset>
    )
  }
)

export default UserAiSettingsPanel
