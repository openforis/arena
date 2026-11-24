import React from 'react'

import { Modal, ModalBody, ModalFooter } from '@webapp/components/Modal'
import { Button } from '@webapp/components/buttons'
import { LoginActions } from '@webapp/store/login'
import { useI18n } from '@webapp/store/system'

interface TestSignInResult {
  providerId?: string
  errorKey?: string
  identity?: { issuer: string; subject: string; email?: string; emailVerified: boolean; name?: string }
  resolution?: { errorKey?: string; alreadyLinked?: boolean }
  matchingUser?: { name: string; email: string; status: string } | null
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => {
  const i18n = useI18n()
  return (
    <>
      <dt>{i18n.t(label)}</dt>
      <dd>{children}</dd>
    </>
  )
}

const getOutcomeKey = (result: TestSignInResult): string => {
  if (result.resolution?.errorKey) return LoginActions.toExternalLoginErrorMessageKey(result.resolution.errorKey)
  return result.resolution?.alreadyLinked
    ? 'authProvidersView:testResult.alreadyLinked'
    : 'authProvidersView:testResult.wouldLink'
}

/**
 * Result of a test sign-in: validated claims and the Arena user that would match (nothing was written).
 */
export const TestSignInResultDialog = ({ result, onClose }: { result: TestSignInResult; onClose: () => void }) => {
  const i18n = useI18n()
  const { identity, matchingUser, errorKey } = result
  return (
    <Modal onClose={onClose} showCloseButton title="authProvidersView:testResult.title">
      <ModalBody>
        {errorKey || !identity ? (
          <div className="auth-providers__alert auth-providers__alert--error" role="alert">
            {i18n.t(LoginActions.toExternalLoginErrorMessageKey(errorKey ?? 'externalLogin.flowInvalid'))}
          </div>
        ) : (
          <>
            <output className="auth-providers__alert auth-providers__alert--success">
              {i18n.t('authProvidersView:testResult.success')}
            </output>
            <dl className="auth-providers__kv" data-testid="auth-provider-test-result">
              <Row label="authProvidersView:testResult.issuer">{identity.issuer}</Row>
              <Row label="authProvidersView:testResult.subject">{identity.subject}</Row>
              <Row label="authProvidersView:testResult.email">
                {identity.email ?? '-'}{' '}
                {identity.email &&
                  i18n.t(
                    identity.emailVerified
                      ? 'authProvidersView:testResult.verified'
                      : 'authProvidersView:testResult.notVerified'
                  )}
              </Row>
              <Row label="authProvidersView:testResult.name">{identity.name ?? '-'}</Row>
              <Row label="authProvidersView:testResult.matchingUser">
                {matchingUser ? `${matchingUser.name || matchingUser.email} (${matchingUser.email})` : '-'}
              </Row>
              <Row label="authProvidersView:testResult.outcome">{i18n.t(getOutcomeKey(result))}</Row>
            </dl>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button label="common.close" onClick={onClose} />
      </ModalFooter>
    </Modal>
  )
}
