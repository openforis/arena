import './AiGenerateQueryPopup.scss'

import React, { useEffect, useRef, useState } from 'react'

import * as API from '@webapp/service/api'
import { Button } from '@webapp/components/buttons'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { useI18n } from '@webapp/store/system'
import { useSurveyCycleKey, useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'

import type { AiDataQueryGenerateResult } from '@webapp/service/api/ai/dataQuery'

type Props = {
  onClose: () => void
  onGenerated: (result: AiDataQueryGenerateResult) => void
}

/**
 * Extracts a user-readable error message from a failed API request.
 * @param {object} params - The parameters.
 * @param {object} params.error - The error thrown by the request.
 * @param {object} params.i18n - The i18n instance.
 * @returns {string} - The error message.
 */
const getErrorMessage = ({ error, i18n }) => {
  const data = error?.response?.data
  const key = data?.error?.key || data?.errorKey
  const params = data?.error?.params || data?.errorParams
  return key ? i18n.t(`appErrors:${key}`, params) : error?.message || 'unknown'
}

export const AiGenerateQueryPopup = (props: Props) => {
  const { onClose, onGenerated } = props

  const i18n = useI18n()
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const descriptionTrimmed = description.trim()

  const onGenerate = async () => {
    if (!descriptionTrimmed || busy) return
    setBusy(true)
    setError(null)
    try {
      const result = await API.aiDataQuery.generate({ surveyId, cycle, lang, description: descriptionTrimmed })
      setBusy(false)
      onGenerated(result)
    } catch (err) {
      setError(getErrorMessage({ error: err, i18n }))
      setBusy(false)
    }
  }

  return (
    <Modal className="ai-generate-query-popup" title="dataView:dataQuery.ai.title" showCloseButton onClose={onClose}>
      <ModalBody>
        <div className="ai-generate-query-popup__hint">{i18n.t('dataView:dataQuery.ai.hint')}</div>

        <textarea
          ref={textareaRef}
          className="ai-generate-query-popup__textarea"
          placeholder={i18n.t('dataView:dataQuery.ai.placeholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={busy}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              onGenerate()
            }
          }}
        />

        {error && <div className="ai-generate-query-popup__error">{error}</div>}
      </ModalBody>

      <ModalFooter>
        <Button label="common.cancel" onClick={onClose} disabled={busy} variant="outlined" />
        <Button
          className="btn-primary"
          label={busy ? 'dataView:dataQuery.ai.generating' : 'dataView:dataQuery.ai.generate'}
          onClick={onGenerate}
          disabled={busy || !descriptionTrimmed}
        />
      </ModalFooter>
    </Modal>
  )
}
