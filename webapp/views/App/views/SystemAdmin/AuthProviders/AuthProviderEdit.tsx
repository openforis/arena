import './AuthProviders.scss'

import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import { appModuleUri, systemAdminModules } from '@webapp/app/appModules'
import { Button } from '@webapp/components/buttons'
import { useNotifyError, useNotifyInfo } from '@webapp/components/hooks'
import Checkbox from '@webapp/components/form/checkbox'
import { FormItem, Input } from '@webapp/components/form/Input'
import LoadingBar from '@webapp/components/LoadingBar'
import { AuthProviderIcon } from '@webapp/components/authProvider/AuthProviderIcon'
import {
  createProvider,
  fetchAdminProvider,
  fetchExternalLoginTicket,
  fetchTestSignInResult,
  getExternalLoginStartUrl,
  testProviderConnection,
  updateProvider,
  uploadProviderIcon,
} from '@webapp/service/api/authProviders'
import { useI18n } from '@webapp/store/system'

import {
  AdminAuthProvider,
  AuthProviderType,
  createNewProvider,
  newProviderId,
  toProviderId,
} from './authProviderTypes'
import { TestSignInResultDialog } from './TestSignInResultDialog'

type Draft = Partial<AdminAuthProvider> & { clientSecret?: string }
type OnChange = (changes: Partial<Draft>) => void
type SectionProps = { draft: Draft; isNew?: boolean; readOnly: boolean; onChange: OnChange }

const listUri = () => appModuleUri(systemAdminModules.authProviders)

const splitList = (value: string, separator: RegExp): string[] =>
  value
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean)

// editable props sent to the server (not the computed ones)
const toProps = (draft: Draft) => {
  const { label, enabled, showOnLoginPage, issuer, tenant, clientId, scopes, allowedEmailDomains, trustEmail } = draft
  const { requireArena2FA, iconKind } = draft
  return {
    label,
    enabled,
    showOnLoginPage,
    issuer,
    tenant,
    clientId,
    scopes,
    allowedEmailDomains,
    trustEmail,
    requireArena2FA,
    iconKind,
  }
}

// arena-server error keys ("appErrors.authProvider.idInvalid") use "." after the namespace
const toI18nKey = (key: string): string => key.replace(/^appErrors\./, 'appErrors:')

const getErrorMessage = (error: any, i18n): string => {
  const data = error?.response?.data
  const fieldErrors = data?.params?.errors
  if (fieldErrors) {
    return Object.values(fieldErrors)
      .map((key) => i18n.t(toI18nKey(String(key))))
      .join('. ')
  }
  return i18n.t(toI18nKey(data?.key ?? data?.message ?? 'appErrors:generic'), data?.params)
}

const GeneralSection = ({ draft, isNew = false, readOnly, onChange }: SectionProps) => {
  const i18n = useI18n()
  const isPreset = draft.type !== 'oidc'
  return (
    <section className="auth-provider-edit__section">
      <h3>{i18n.t('authProvidersView:form.general')}</h3>
      <div className="auth-provider-edit__fields">
        <FormItem label="authProvidersView:form.label">
          <Input
            disabled={readOnly}
            name="label"
            onChange={(label) => onChange({ label, ...(isNew ? { id: toProviderId(label) } : {}) })}
            value={draft.label ?? ''}
          />
        </FormItem>
        <FormItem info="authProvidersView:form.idInfo" label="authProvidersView:form.id">
          <Input disabled={!isNew} name="id" onChange={(id) => onChange({ id })} value={draft.id ?? ''} />
        </FormItem>
      </div>
      {!isPreset && !readOnly && !isNew && (
        <FormItem label="authProvidersView:form.icon">
          <IconEditor draft={draft} onChange={onChange} />
        </FormItem>
      )}
      <Checkbox
        checked={Boolean(draft.enabled)}
        disabled={readOnly}
        info="authProvidersView:form.enabledInfo"
        label="authProvidersView:form.enabled"
        onChange={(enabled) => onChange({ enabled })}
      />
      <Checkbox
        checked={Boolean(draft.showOnLoginPage)}
        disabled={readOnly}
        info="authProvidersView:form.showOnLoginPageInfo"
        infoParams={{ path: `/guest/login?provider=${draft.id ?? ''}` }}
        label="authProvidersView:form.showOnLoginPage"
        onChange={(showOnLoginPage) => onChange({ showOnLoginPage })}
      />
    </section>
  )
}

const IconEditor = ({ draft, onChange }: { draft: Draft; onChange: OnChange }) => {
  const notifyError = useNotifyError()
  const [version, setVersion] = useState(0)
  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !draft.id) return
    try {
      await uploadProviderIcon({ id: draft.id, file })
      setVersion(Date.now())
      onChange({ iconKind: 'uploaded' })
    } catch {
      notifyError({ key: 'authProvidersView:form.iconInvalid' })
    }
  }
  return (
    <div className="auth-provider-edit__icon">
      <AuthProviderIcon iconKind={draft.iconKind} iconVersion={version} providerId={draft.id ?? ''} type={draft.type} />
      <Checkbox
        checked={draft.iconKind === 'uploaded'}
        label="authProvidersView:form.useUploadedIcon"
        onChange={(uploaded) => onChange({ iconKind: uploaded ? 'uploaded' : 'generic' })}
      />
      <input accept="image/png,image/svg+xml" aria-label="icon" onChange={onFileChange} type="file" />
    </div>
  )
}

const ConnectionSection = ({ draft, isNew = false, readOnly, onChange }: SectionProps) => {
  const i18n = useI18n()
  return (
    <section className="auth-provider-edit__section">
      <h3>{i18n.t('authProvidersView:form.connection')}</h3>
      <div className="auth-provider-edit__fields">
        {draft.type === 'oidc' && (
          <FormItem info="authProvidersView:form.issuerInfo" label="authProvidersView:form.issuer">
            <Input
              disabled={readOnly}
              name="issuer"
              onChange={(issuer) => onChange({ issuer })}
              value={draft.issuer ?? ''}
            />
          </FormItem>
        )}
        {draft.type === 'microsoft' && (
          <FormItem info="authProvidersView:form.tenantInfo" label="authProvidersView:form.tenant">
            <Input
              disabled={readOnly}
              name="tenant"
              onChange={(tenant) => onChange({ tenant })}
              value={draft.tenant ?? ''}
            />
          </FormItem>
        )}
        <FormItem label="authProvidersView:form.clientId">
          <Input
            disabled={readOnly}
            name="clientId"
            onChange={(clientId) => onChange({ clientId })}
            value={draft.clientId ?? ''}
          />
        </FormItem>
        {!readOnly && (
          <FormItem
            info={isNew ? undefined : 'authProvidersView:form.clientSecretInfo'}
            label="authProvidersView:form.clientSecret"
          >
            <Input
              name="clientSecret"
              onChange={(clientSecret) => onChange({ clientSecret })}
              placeholder={draft.hasClientSecret ? i18n.t('authProvidersView:form.clientSecretSet') : ''}
              type="password"
              value={draft.clientSecret ?? ''}
            />
          </FormItem>
        )}
        <FormItem info="authProvidersView:form.scopesInfo" label="authProvidersView:form.scopes">
          <Input
            disabled={readOnly}
            name="scopes"
            onChange={(value) => onChange({ scopes: splitList(value, /\s+/) })}
            value={(draft.scopes ?? []).join(' ')}
          />
        </FormItem>
      </div>
    </section>
  )
}

const AccessSection = ({ draft, readOnly, onChange }: SectionProps) => {
  const i18n = useI18n()
  return (
    <section className="auth-provider-edit__section">
      <h3>{i18n.t('authProvidersView:form.access')}</h3>
      <p className="auth-providers__muted">{i18n.t('authProvidersView:form.accessDescription')}</p>
      <FormItem
        info="authProvidersView:form.allowedEmailDomainsInfo"
        label="authProvidersView:form.allowedEmailDomains"
      >
        <Input
          disabled={readOnly}
          name="allowedEmailDomains"
          onChange={(value) => onChange({ allowedEmailDomains: splitList(value, /[\s,;]+/) })}
          value={(draft.allowedEmailDomains ?? []).join(', ')}
        />
      </FormItem>
      <Checkbox
        checked={Boolean(draft.requireArena2FA)}
        disabled={readOnly}
        info="authProvidersView:form.requireArena2FAInfo"
        label="authProvidersView:form.requireArena2FA"
        onChange={(requireArena2FA) => onChange({ requireArena2FA })}
      />
      {draft.type !== 'google' && (
        <Checkbox
          checked={Boolean(draft.trustEmail)}
          disabled={readOnly}
          info="authProvidersView:form.trustEmailInfo"
          label="authProvidersView:form.trustEmail"
          onChange={(trustEmail) => onChange({ trustEmail })}
        />
      )}
    </section>
  )
}

const SidePanel = ({ draft }: { draft: Draft }) => {
  const i18n = useI18n()
  const notifyInfo = useNotifyInfo()
  const redirectUri = draft.redirectUri ?? `${globalThis.location.origin}/auth/oidc/${draft.id || '<id>'}/callback`
  const onCopy = async () => {
    await navigator.clipboard.writeText(redirectUri)
    notifyInfo({ key: 'authProvidersView:form.redirectUriCopied' })
  }
  return (
    <aside className="auth-provider-edit__side">
      <h4>{i18n.t('authProvidersView:form.redirectUri')}</h4>
      <div className="auth-provider-edit__redirect-uri">
        <code data-testid="auth-provider-redirect-uri">{redirectUri}</code>
        <Button iconClassName="icon-copy" onClick={onCopy} showLabel={false} title="common.copy" variant="text" />
      </div>
      <ol className="auth-provider-edit__steps">
        {['register', 'redirectUri', 'scopes', 'credentials'].map((step) => (
          <li key={step}>{i18n.t(`authProvidersView:form.setupSteps.${step}`)}</li>
        ))}
      </ol>
      <h4>{i18n.t('authProvidersView:form.loginPagePreview')}</h4>
      <div className="auth-provider-edit__preview">
        <span className="guest-external-login__button">
          <AuthProviderIcon iconKind={draft.iconKind} providerId={draft.id ?? ''} type={draft.type} />
          <span>{i18n.t('guest:externalLogin.signInWith', { provider: draft.label || '…' })}</span>
        </span>
      </div>
    </aside>
  )
}

const useProviderDraft = () => {
  const { providerId = newProviderId } = useParams()
  const [searchParams] = useSearchParams()
  const isNew = providerId === newProviderId
  const [draft, setDraft] = useState<Draft | null>(null)

  const load = useCallback(async () => {
    if (isNew) {
      setDraft(createNewProvider((searchParams.get('type') as AuthProviderType) ?? 'oidc'))
    } else {
      setDraft(await fetchAdminProvider({ id: providerId }))
    }
  }, [isNew, providerId, searchParams])

  useEffect(() => {
    const loadDraft = async () => {
      await load()
    }
    void loadDraft()
  }, [load])

  const onChange: OnChange = useCallback((changes) => setDraft((current) => ({ ...current, ...changes })), [])
  return { draft, isNew, onChange, reload: load }
}

// test sign-in result: shown when the admin comes back from the provider
const useTestSignInResult = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [result, setResult] = useState<any>(null)
  useEffect(() => {
    if (!searchParams.get('externalLoginTest')) return
    fetchTestSignInResult()
      .then(setResult)
      .catch(() => setResult({ errorKey: 'externalLogin.flowInvalid' }))
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])
  return { result, clear: () => setResult(null) }
}

/**
 * System admin page: creation and editing of an external login provider.
 */
const AuthProviderEdit = (): React.ReactElement => {
  const i18n = useI18n()
  const notifyInfo = useNotifyInfo()
  const notifyError = useNotifyError()
  const navigate = useNavigate()
  const { draft, isNew, onChange, reload } = useProviderDraft()
  const testSignIn = useTestSignInResult()

  const onSave = useCallback(async () => {
    if (!draft) return
    try {
      if (isNew) {
        await createProvider({
          id: draft.id,
          type: draft.type,
          props: toProps(draft),
          clientSecret: draft.clientSecret,
        })
      } else {
        await updateProvider({ id: draft.id, props: toProps(draft), clientSecret: draft.clientSecret || undefined })
      }
      notifyInfo({ key: 'common.saved' })
      navigate(listUri())
    } catch (error) {
      notifyError({ key: 'authProvidersView:form.errors', params: { errors: getErrorMessage(error, i18n) } })
    }
  }, [draft, i18n, isNew, navigate, notifyError, notifyInfo])

  const onTestConnection = useCallback(async () => {
    const result = await testProviderConnection({ id: draft!.id! })
    if (result?.ok) {
      notifyInfo({ key: 'authProvidersView:form.testConnectionOk', params: result })
    } else {
      notifyError({ key: 'authProvidersView:form.testConnectionFailed', params: result })
    }
    await reload()
  }, [draft, notifyError, notifyInfo, reload])

  const onTestSignIn = useCallback(async () => {
    const providerId = draft!.id!
    const ticket = await fetchExternalLoginTicket({ providerId, mode: 'test' })
    globalThis.location.assign(
      getExternalLoginStartUrl({ providerId, query: { ticket, returnTo: globalThis.location.pathname } })
    )
  }, [draft])

  if (!draft) return <LoadingBar />

  const readOnly = draft.source === 'env'

  return (
    <div className="auth-providers auth-provider-edit">
      <div className="auth-providers__header">
        <h1 className="auth-provider-edit__title">
          <AuthProviderIcon iconKind={draft.iconKind} providerId={draft.id ?? ''} type={draft.type} />
          {isNew
            ? i18n.t('authProvidersView:form.newTitle', { type: i18n.t(`authProvidersView:types.${draft.type}`) })
            : draft.label}
        </h1>
        <Button
          iconClassName="icon-arrow-left"
          label="common.back"
          onClick={() => navigate(listUri())}
          variant="text"
        />
      </div>
      {readOnly && (
        <div className="auth-providers__alert auth-providers__alert--info" role="note">
          {i18n.t('authProvidersView:form.readOnlyEnv')}
        </div>
      )}
      <div className="auth-provider-edit__layout">
        <div className="auth-provider-edit__form">
          <GeneralSection draft={draft} isNew={isNew} onChange={onChange} readOnly={readOnly} />
          <ConnectionSection draft={draft} isNew={isNew} onChange={onChange} readOnly={readOnly} />
          <AccessSection draft={draft} onChange={onChange} readOnly={readOnly} />
          <div className="auth-provider-edit__footer">
            {!isNew && (
              <>
                <Button
                  iconClassName="icon-play3"
                  label="authProvidersView:form.testConnection"
                  onClick={onTestConnection}
                  variant="outlined"
                />
                <Button
                  iconClassName="icon-new-tab"
                  label="authProvidersView:form.testSignIn"
                  onClick={onTestSignIn}
                  variant="text"
                />
              </>
            )}
            {!readOnly && <Button label="common.save" onClick={onSave} testId="auth-provider-save" />}
          </div>
        </div>
        <SidePanel draft={draft} />
      </div>
      {testSignIn.result && <TestSignInResultDialog onClose={testSignIn.clear} result={testSignIn.result} />}
    </div>
  )
}

export default AuthProviderEdit
