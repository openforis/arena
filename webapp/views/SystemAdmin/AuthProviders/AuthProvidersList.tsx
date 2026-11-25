import './AuthProviders.scss'

import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { appModuleUri, systemAdminModules } from '@webapp/app/appModules'
import { Button } from '@webapp/components/buttons'
import { useConfirmAsync } from '@webapp/components/hooks'
import LoadingBar from '@webapp/components/LoadingBar'
import { AuthProviderIcon } from '@webapp/components/authProvider/AuthProviderIcon'
import {
  deleteProvider,
  fetchAdminProviders,
  fetchUsersWithoutOtherSignInMethod,
  reorderProviders,
  updateProvider,
} from '@webapp/service/api/authProviders'
import { useI18n } from '@webapp/store/system'

import { AddAuthProviderDialog } from './AddAuthProviderDialog'
import { AdminAuthProvider } from './authProviderTypes'

const getProviderUri = (id: string): string => `${appModuleUri(systemAdminModules.authProvider)}${id}/`

const StatusChip = ({ provider }: { provider: AdminAuthProvider }) => {
  const i18n = useI18n()
  const status = provider.enabled ? 'enabled' : 'disabled'
  return (
    <span className={`auth-providers__chip auth-providers__chip--${status}`}>
      {i18n.t(`authProvidersView:status.${status}`)}
    </span>
  )
}

const useAuthProviders = () => {
  const [state, setState] = useState<{ providers: AdminAuthProvider[]; secretEncryptionAvailable: boolean } | null>(
    null
  )
  const reload = useCallback(async () => {
    setState(await fetchAdminProviders())
  }, [])
  useEffect(() => {
    const load = async () => {
      await reload()
    }
    void load()
  }, [reload])
  return { state, reload }
}

const ProviderRow = (props: {
  provider: AdminAuthProvider
  index: number
  count: number
  onMove: (index: number, offset: number) => void
  onToggleEnabled: (provider: AdminAuthProvider) => void
  onDelete: (provider: AdminAuthProvider) => void
}) => {
  const { provider, index, count, onMove, onToggleEnabled, onDelete } = props
  const i18n = useI18n()
  const navigate = useNavigate()
  const readOnly = provider.source === 'env'
  return (
    <tr
      className={provider.enabled ? undefined : 'auth-providers__row--disabled'}
      data-testid={`auth-provider-row-${provider.id}`}
    >
      <td>
        <div className="auth-providers__name">
          <AuthProviderIcon iconKind={provider.iconKind} providerId={provider.id} type={provider.type} />
          <div>
            <b>{provider.label}</b>
            <div className="auth-providers__muted">
              {provider.id}
              {readOnly && <span className="auth-providers__chip">{i18n.t('authProvidersView:source.env')}</span>}
            </div>
          </div>
        </div>
      </td>
      <td>{i18n.t(`authProvidersView:types.${provider.type}`)}</td>
      <td>
        <StatusChip provider={provider} />
      </td>
      <td>
        {i18n.t(
          provider.showOnLoginPage ? 'authProvidersView:loginPage.shown' : 'authProvidersView:loginPage.directLinkOnly'
        )}
      </td>
      <td>{provider.linkedUsersCount}</td>
      <td>
        <div className="auth-providers__row-actions">
          <Button
            disabled={readOnly || index === 0}
            iconClassName="icon-arrow-up"
            onClick={() => onMove(index, -1)}
            showLabel={false}
            title="authProvidersView:moveUp"
            variant="text"
          />
          <Button
            disabled={readOnly || index === count - 1}
            iconClassName="icon-arrow-down"
            onClick={() => onMove(index, 1)}
            showLabel={false}
            title="authProvidersView:moveDown"
            variant="text"
          />
          <Button
            iconClassName={readOnly ? 'icon-eye' : 'icon-pencil2'}
            onClick={() => navigate(getProviderUri(provider.id))}
            showLabel={false}
            testId={`auth-provider-edit-${provider.id}`}
            title={readOnly ? 'common.view' : 'common.edit'}
            variant="text"
          />
          {!readOnly && (
            <>
              <Button
                label={provider.enabled ? 'authProvidersView:disable' : 'authProvidersView:enable'}
                onClick={() => onToggleEnabled(provider)}
                size="small"
                variant="outlined"
              />
              <Button
                iconClassName="icon-bin2"
                onClick={() => onDelete(provider)}
                showLabel={false}
                testId={`auth-provider-delete-${provider.id}`}
                title="common.delete"
                variant="text"
              />
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

/**
 * System admin page: external login providers shown on the login page, in their order.
 */
const AuthProvidersList = (): React.ReactElement => {
  const i18n = useI18n()
  const navigate = useNavigate()
  const confirm = useConfirmAsync()
  const { state, reload } = useAuthProviders()
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const onMove = useCallback(
    async (index: number, offset: number) => {
      if (!state) return
      const ids = state.providers.map((provider) => provider.id)
      const [moved] = ids.splice(index, 1)
      ids.splice(index + offset, 0, moved)
      await reorderProviders({ ids })
      await reload()
    },
    [reload, state]
  )

  const onToggleEnabled = useCallback(
    async (provider: AdminAuthProvider) => {
      await updateProvider({ id: provider.id, props: { enabled: !provider.enabled }, clientSecret: undefined })
      await reload()
    },
    [reload]
  )

  const onDelete = useCallback(
    async (provider: AdminAuthProvider) => {
      const usersWithoutOtherMethod = await fetchUsersWithoutOtherSignInMethod({ id: provider.id })
      const confirmed = await confirm({
        key: 'authProvidersView:deleteConfirm',
        params: {
          provider: provider.label,
          linkedUsersCount: provider.linkedUsersCount,
          usersWithoutOtherMethod: usersWithoutOtherMethod.map((user) => user.email).join(', ') || '-',
        },
        strongConfirm: true,
        strongConfirmRequiredText: provider.id,
      })
      if (!confirmed) return
      // the users left without any sign-in method are told how to set a password
      await deleteProvider({ id: provider.id, notifyUsers: true })
      await reload()
    },
    [confirm, reload]
  )

  if (!state) return <LoadingBar />

  const { providers, secretEncryptionAvailable } = state

  return (
    <div className="auth-providers">
      <div className="auth-providers__header">
        <div>
          <h1>{i18n.t('authProvidersView:title')}</h1>
          <p className="auth-providers__muted">{i18n.t('authProvidersView:subtitle')}</p>
        </div>
        <div className="auth-providers__header-actions">
          <Button
            disabled={!secretEncryptionAvailable}
            iconClassName="icon-plus"
            label="authProvidersView:addProvider"
            onClick={() => setAddDialogOpen(true)}
            testId="auth-provider-add"
          />
        </div>
      </div>
      {!secretEncryptionAvailable && (
        <div className="auth-providers__alert auth-providers__alert--warning" role="alert">
          {i18n.t('authProvidersView:encryptionKeyMissing')}
        </div>
      )}
      {providers.length === 0 ? (
        <div className="auth-providers__empty">
          <h3>{i18n.t('authProvidersView:empty.title')}</h3>
          <p className="auth-providers__muted">{i18n.t('authProvidersView:empty.description')}</p>
        </div>
      ) : (
        <table className="auth-providers__table">
          <thead>
            <tr>
              <th>{i18n.t('authProvidersView:columns.provider')}</th>
              <th>{i18n.t('authProvidersView:columns.type')}</th>
              <th>{i18n.t('authProvidersView:columns.status')}</th>
              <th>{i18n.t('authProvidersView:columns.loginPage')}</th>
              <th>{i18n.t('authProvidersView:columns.linkedUsers')}</th>
              <th aria-label={i18n.t('authProvidersView:columns.actions')} />
            </tr>
          </thead>
          <tbody>
            {providers.map((provider, index) => (
              <ProviderRow
                key={provider.id}
                count={providers.length}
                index={index}
                onDelete={onDelete}
                onMove={onMove}
                onToggleEnabled={onToggleEnabled}
                provider={provider}
              />
            ))}
          </tbody>
        </table>
      )}
      <p className="auth-providers__muted">{i18n.t('authProvidersView:passwordAlwaysAvailable')}</p>
      {addDialogOpen && (
        <AddAuthProviderDialog
          onClose={() => setAddDialogOpen(false)}
          onSelect={(type) => navigate(`${getProviderUri('_new')}?type=${type}`)}
        />
      )}
    </div>
  )
}

export default AuthProvidersList
