import { useState } from 'react'

import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { Button } from '@webapp/components/buttons'
import { AuthProviderIcon } from '@webapp/components/authProvider/AuthProviderIcon'
import { useI18n } from '@webapp/store/system'

import { AuthProviderType, authProviderTypes } from './authProviderTypes'

type Props = {
  onClose: () => void
  onSelect: (type: AuthProviderType) => void
}

/**
 * First step of adding a provider: the type decides which fields the form shows.
 */
export const AddAuthProviderDialog = ({ onClose, onSelect }: Props) => {
  const i18n = useI18n()
  const [type, setType] = useState<AuthProviderType>('google')

  return (
    <Modal
      className="auth-providers__add-dialog"
      onClose={onClose}
      showCloseButton
      title="authProvidersView:addProvider"
    >
      <ModalBody>
        <p className="auth-providers__muted">{i18n.t('authProvidersView:addDialog.description')}</p>
        <div className="auth-providers__presets" role="radiogroup">
          {authProviderTypes.map((item) => (
            <button
              key={item}
              aria-checked={item === type}
              className={`auth-providers__preset${item === type ? ' auth-providers__preset--selected' : ''}`}
              data-testid={`auth-provider-type-${item}`}
              onClick={() => setType(item)}
              role="radio"
              type="button"
            >
              <AuthProviderIcon iconKind={item === 'oidc' ? 'generic' : 'builtin'} providerId="" type={item} />
              <b>{i18n.t(`authProvidersView:types.${item}`)}</b>
              <span className="auth-providers__muted">
                {i18n.t(`authProvidersView:addDialog.typeDescription.${item}`)}
              </span>
            </button>
          ))}
        </div>
        <p className="auth-providers__muted">{i18n.t('authProvidersView:addDialog.notSupportedYet')}</p>
      </ModalBody>
      <ModalFooter>
        <Button label="common.cancel" onClick={onClose} variant="text" />
        <Button label="authProvidersView:continue" onClick={() => onSelect(type)} testId="auth-provider-add-continue" />
      </ModalFooter>
    </Modal>
  )
}
