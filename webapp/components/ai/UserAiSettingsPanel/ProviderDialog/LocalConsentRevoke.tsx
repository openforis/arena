import React, { useCallback, useState } from 'react'

import { getCurrentUserUuid } from '@webapp/ai/engines/capabilitiesStore'
import { hasLocalServerConsent, revokeLocalServerConsent } from '@webapp/ai/engines/localServerConsent'
import { getBrowserStorage } from '@webapp/ai/engines/localServerSettings'
import { Button } from '@webapp/components/buttons'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

type Props = {
  // the saved URL of the provider being edited; null when adding one
  baseUrl: string | null
}

/**
 * Where the user takes back the permission to send requests to the saved local server: the first-use dialog stores it
 * per survey, and this removes it for every survey, so the next request asks again. Nothing is shown without one.
 * @param {Props} props - Props.
 * @returns {React.ReactElement|null} The line, or null when there is no permission to revoke.
 */
export const LocalConsentRevoke = ({ baseUrl }: Props) => {
  const t = useI18nT({ unescapeHtml: true })
  const [revoked, setRevoked] = useState(false)
  const [allowed, setAllowed] = useState(() =>
    baseUrl ? hasLocalServerConsent({ storage: getBrowserStorage(), userUuid: getCurrentUserUuid(), baseUrl }) : false
  )

  const onRevoke = useCallback(() => {
    if (!baseUrl) return
    const done = revokeLocalServerConsent({ storage: getBrowserStorage(), userUuid: getCurrentUserUuid(), baseUrl })
    if (!done) return
    setAllowed(false)
    setRevoked(true)
  }, [baseUrl])

  if (revoked) return <div className="provider-dialog__hint">{t('aiEngine.consent.revoked')}</div>
  if (!allowed) return null
  return (
    <div className="provider-dialog__row">
      <span className="provider-dialog__hint">{t('aiEngine.consent.revokeHint')}</span>
      <Button
        label="aiEngine.consent.revoke"
        onClick={onRevoke}
        size="small"
        testId={TestId.ai.consentRevoke}
        variant="outlined"
      />
    </div>
  )
}
