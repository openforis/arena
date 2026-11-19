import React from 'react'

import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'

import { Button } from '@webapp/components'
import UserAiSettingsPanel from '@webapp/components/ai/UserAiSettingsPanel'
import { Input } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'

import { UserEditSection } from '../UserEditSection'

const planetProvider = 'planet'

type Props = {
  aiFeaturesEnabled: boolean
  aiSaveRef: React.Ref<() => Promise<void>>
  canEditMapApiKeys: boolean
  canUseMap: boolean
  onAiSettingsDirtyChange: (dirty: boolean) => void
  onMapApiKeyTest: (params: { provider: string; apiKey: string }) => void
  onUpdate: (user: any) => void
  userToUpdate: any
  validation: any
}

/**
 * Personal keys of the logged-in user for external services: map providers and AI.
 */
export const IntegrationsSection = (props: Props) => {
  const {
    aiFeaturesEnabled,
    aiSaveRef,
    canEditMapApiKeys,
    canUseMap,
    onAiSettingsDirtyChange,
    onMapApiKeyTest,
    onUpdate,
    userToUpdate,
    validation,
  } = props
  const i18n = useI18n()
  const planetApiKey = User.getMapApiKey({ provider: planetProvider })(userToUpdate)
  const planetInputId = 'user-edit-map-api-key-planet'

  return (
    <UserEditSection
      description="usersView:profile.sections.integrationsDescription"
      id="user-edit-integrations"
      title="usersView:profile.sections.integrations"
    >
      {canUseMap && (
        <div className="user-edit-map-api-keys">
          <h3 className="user-edit-section__subtitle">{i18n.t('user.mapApiKeys.title')}</h3>
          <div className="user-edit-map-api-keys__row">
            <label htmlFor={planetInputId}>{i18n.t('user.mapApiKeys.mapProviders.planet')}</label>
            <Input
              disabled={!canEditMapApiKeys}
              id={planetInputId}
              onChange={(value) =>
                onUpdate(User.assocMapApiKey({ provider: planetProvider, apiKey: value })(userToUpdate))
              }
              validation={Validation.getFieldValidation(`${User.keysProps.mapApiKeyByProvider}.${planetProvider}`)(
                validation
              )}
              value={planetApiKey}
            />
            <Button
              className="btn-s"
              label="common.test"
              onClick={() => onMapApiKeyTest({ provider: planetProvider, apiKey: planetApiKey })}
              variant="outlined"
            />
          </div>
        </div>
      )}
      {aiFeaturesEnabled && <UserAiSettingsPanel ref={aiSaveRef} onDirtyChange={onAiSettingsDirtyChange} />}
    </UserEditSection>
  )
}
