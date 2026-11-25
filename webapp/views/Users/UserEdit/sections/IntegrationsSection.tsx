import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'
import { Button } from '@webapp/components'
import { Input } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'
import { UserEditSection } from '../UserEditSection'

const planetProvider = 'planet'

type Props = {
  canEditMapApiKeys: boolean
  onMapApiKeyTest: (params: { provider: string; apiKey: string }) => void
  onUpdate: (user: any) => void
  userToUpdate: any
  validation: any
}

/**
 * Personal keys of the logged-in user for external services (map providers).
 */
export const IntegrationsSection = (props: Props) => {
  const { canEditMapApiKeys, onMapApiKeyTest, onUpdate, userToUpdate, validation } = props
  const i18n = useI18n()
  const planetApiKey = User.getMapApiKey({ provider: planetProvider })(userToUpdate)
  const planetInputId = 'user-edit-map-api-key-planet'

  return (
    <UserEditSection
      description="usersView:profile.sections.integrationsDescription"
      id="user-edit-integrations"
      title="usersView:profile.sections.integrations"
    >
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
    </UserEditSection>
  )
}
