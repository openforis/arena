import './UserAiSettingsPanel.scss'

import React, { useEffect, useImperativeHandle } from 'react'

import { Fieldset } from '@webapp/components/Fieldset'

import { AiAccessLevel } from './AiAccessLevel'
import { ProviderList } from './ProviderList'
import { useUserAiSettings } from './useUserAiSettings'

type UserAiSettingsPanelProps = {
  // legend of the panel; null when the panel is already inside a titled container
  legend?: string | null
  onDirtyChange?: ((dirty: boolean) => void) | null
  // called once the settings are loaded: false when AI features are disabled on the server (the panel renders nothing)
  onAvailableChange?: ((available: boolean) => void) | null
}

/**
 * AI panel of the User Profile page: what AI can see (saved by the parent's Save, through the function exposed by
 * the ref) and the providers (saved by their own dialog and menu).
 */
const UserAiSettingsPanel = React.forwardRef<() => Promise<void>, UserAiSettingsPanelProps>(
  ({ legend = 'userAiSettings:section', onDirtyChange = null, onAvailableChange = null }, ref) => {
    const panel = useUserAiSettings()
    const { i18n, loading, settings, form, dirty, onSave } = panel

    useImperativeHandle(ref, () => onSave, [onSave])

    useEffect(() => {
      onDirtyChange?.(dirty)
    }, [dirty, onDirtyChange])

    const available = Boolean(settings) && !settings?.aiFeaturesDisabled

    useEffect(() => {
      if (!loading) onAvailableChange?.(available)
    }, [available, loading, onAvailableChange])

    if (loading || !settings || !available) return null

    return (
      <Fieldset className="user-ai-settings-panel" legend={legend ?? undefined}>
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
        {form.accessLevel > 0 && <ProviderList settings={settings} reloadSettings={panel.reloadSettings} />}
      </Fieldset>
    )
  }
)

export default UserAiSettingsPanel
