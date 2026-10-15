import './LocalServerConsentHost.scss'

import React, { useCallback, useSyncExternalStore } from 'react'

import {
  answerConsentRequest,
  getPendingConsentRequest,
  subscribeConsentRequests,
} from '@webapp/ai/engines/consentRequests'
import type { LocalServerConsentAnswer } from '@webapp/ai/engines/resolveModel'
import { getAiDataLocationText } from '@webapp/ai/policy/aiFeatureAvailability'
import { Button } from '@webapp/components/buttons'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

/**
 * First-use dialog of a local provider: says where the requests of this survey will go and what they send (the survey
 * design or record data), and asks to continue, or to choose another provider (the request then fails with
 * aiProviderChooseAnother).
 * Mounted once in AppView; resolveModel opens it through the consent queue.
 * @returns {React.ReactElement|null} The dialog, or null when nothing is pending.
 */
export const LocalServerConsentHost = () => {
  const t = useI18nT({ unescapeHtml: true })
  const request = useSyncExternalStore(subscribeConsentRequests, getPendingConsentRequest)
  const requestId = request?.id

  const answer = useCallback(
    (value: LocalServerConsentAnswer) => {
      if (requestId !== undefined) answerConsentRequest(requestId, value)
    },
    [requestId]
  )
  const onContinue = useCallback(() => answer('continue'), [answer])
  const onChooseOther = useCallback(() => answer('chooseOther'), [answer])
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
          <p>{t('aiEngine.consent.sends', { what: t(`aiPolicy.dataClass.${request.dataClass}`) })}</p>
          {request.modelId && (
            <p className="local-server-consent__model">{t('aiEngine.consent.model', { modelId: request.modelId })}</p>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button label="aiEngine.consent.continue" onClick={onContinue} testId={TestId.ai.consentContinue} />
        <Button
          label="aiEngine.consent.chooseOther"
          onClick={onChooseOther}
          testId={TestId.ai.consentChooseOther}
          variant="outlined"
        />
      </ModalFooter>
    </Modal>
  )
}
