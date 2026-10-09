import './LocalServerConsentHost.scss'

import React, { useCallback, useSyncExternalStore } from 'react'

import {
  answerConsentRequest,
  getPendingConsentRequest,
  subscribeConsentRequests,
} from '@webapp/ai/engines/consentRequests'
import { getAiDataLocationText } from '@webapp/ai/policy/aiFeatureAvailability'
import { Button } from '@webapp/components/buttons'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

/**
 * First-use dialog of the local AI server: says where the requests of this survey will go and asks to continue.
 * Mounted once in AppView; resolveModel opens it through the consent queue.
 * @returns {React.ReactElement|null} The dialog, or null when nothing is pending.
 */
export const LocalServerConsentHost = () => {
  const t = useI18nT({ unescapeHtml: true })
  const request = useSyncExternalStore(subscribeConsentRequests, getPendingConsentRequest)
  const requestId = request?.id

  const answer = useCallback(
    (value: 'continue' | 'useOther' | 'cancel') => {
      if (requestId !== undefined) answerConsentRequest(requestId, value)
    },
    [requestId]
  )
  const onContinue = useCallback(() => answer('continue'), [answer])
  const onUseOther = useCallback(() => answer('useOther'), [answer])
  const onCancel = useCallback(() => answer('cancel'), [answer])

  if (!request) return null

  const location = getAiDataLocationText({
    location: { hostingClass: request.hostingClass, provider: null, model: null, engine: null },
    t,
  })
  const destinationKey = request.surveyId ? 'aiEngine.consent.destination' : 'aiEngine.consent.destinationNoSurvey'

  return (
    <Modal className="local-server-consent" onClose={onCancel} showCloseButton title="aiEngine.consent.title">
      <ModalBody>
        <div data-testid={TestId.ai.consentDialog}>
          <p>{t(destinationKey, { baseUrl: request.baseUrl, location })}</p>
          {request.modelId && (
            <p className="local-server-consent__model">{t('aiEngine.consent.model', { modelId: request.modelId })}</p>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button label="aiEngine.consent.continue" onClick={onContinue} testId={TestId.ai.consentContinue} />
        {request.canUseOther && (
          <Button
            label="aiEngine.consent.useOther"
            onClick={onUseOther}
            testId={TestId.ai.consentUseOther}
            variant="outlined"
          />
        )}
      </ModalFooter>
    </Modal>
  )
}
