import '@webapp/components/ai/aiTextarea.scss'
import './AiGenerateQueryPopup.scss'

import React, { useEffect, useRef, useState } from 'react'

import { AiWorkflows, getAiErrorMessage, type AiDataQueryGenerateResult } from '@webapp/ai/workflows'
import { AiFeatureDataLocationBadge } from '@webapp/components/ai/AiDataLocationBadge'
import { Button } from '@webapp/components/buttons'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { useI18n } from '@webapp/store/system'
import { useSurvey, useSurveyCycleKey, useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'
import { useAuthCanUseAnalysis } from '@webapp/store/user'

type Props = {
  onClose: () => void
  onGenerated: (result: AiDataQueryGenerateResult) => void
}

export const AiGenerateQueryPopup = (props: Props) => {
  const { onClose, onGenerated } = props

  const i18n = useI18n()
  const survey = useSurvey()
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()
  const includeAnalysis = useAuthCanUseAnalysis()
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
      const result = await AiWorkflows.generateDataQuery({
        survey,
        surveyId,
        cycle,
        lang,
        description: descriptionTrimmed,
        includeAnalysis,
      })
      setBusy(false)
      onGenerated(result)
    } catch (err) {
      setError(getAiErrorMessage({ error: err, i18n }))
      setBusy(false)
    }
  }

  return (
    <Modal className="ai-generate-query-popup" title="dataView:dataQuery.ai.title" showCloseButton onClose={onClose}>
      <ModalBody>
        <AiFeatureDataLocationBadge feature="dataQueryGenerate" />
        <div className="ai-generate-query-popup__hint">{i18n.t('dataView:dataQuery.ai.hint')}</div>

        <textarea
          ref={textareaRef}
          className="ai-textarea"
          placeholder={i18n.t('dataView:dataQuery.ai.placeholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={busy}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              void onGenerate()
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
