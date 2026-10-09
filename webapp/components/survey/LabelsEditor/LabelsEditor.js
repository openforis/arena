import './LabelsEditor.scss'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import * as A from '@core/arena'
import classNames from 'classnames'

import { AiWorkflows, getAiErrorMessage, isAiAbortError } from '@webapp/ai/workflows'
import { useI18n } from '@webapp/store/system'
import { useSurveyLangs, useSurveyPreferredLang, useSurveyId } from '@webapp/store/survey'
import { useNotifyInfo, useNotifyError } from '@webapp/components/hooks'

import { Button } from '@webapp/components/buttons'
import { Spinner } from '@webapp/components/Spinner'
import ValidationTooltip from '@webapp/components/validationTooltip'
import { isAiFeatureShown, isAiFeatureUsable } from '@webapp/ai/policy/aiFeatureAvailability'
import { AiPolicyBlockedTooltip } from '@webapp/components/ai/AiPolicyBlockedTooltip'
import { useAiFeatureAvailability } from '@webapp/components/ai/hooks/useAiFeatureAvailability'
import { AiFeatureDataLocationBadge } from '@webapp/components/ai/AiDataLocationBadge'

import Label from './Label'
import ButtonToggle from './ButtonToggle'

const MAX_PREVIEW_LANGUAGES = 1

// puts the preferred language on top
const sortLanguages = ({ languages, preferredLanguage }) =>
  [...languages].sort((langA, langB) => {
    if (langA === preferredLanguage) return -1
    if (langB === preferredLanguage) return 1
    return 0
  })

const LabelsEditor = (props) => {
  const {
    autoFocus,
    compactLanguage = false,
    formLabelKey = 'common.label',
    inputFieldIdPrefix,
    inputType = 'input',
    labels = {},
    languages: languagesFromProps = [],
    onChange,
    placeholder,
    readOnly = false,
    showFormLabel = true,
    textTransformFunction,
    validation,
  } = props

  const i18n = useI18n()
  const surveyId = useSurveyId()
  const notifyInfo = useNotifyInfo()
  const notifyError = useNotifyError()
  const [editingLabels, setEditingLabels] = useState(false)
  const [translating, setTranslating] = useState(false)
  // aborts an in-flight translation when the editor unmounts (its result would be applied to a closed editor)
  const translationAbortRef = useRef(null)
  useEffect(
    () => () => {
      translationAbortRef.current?.abort()
    },
    []
  )
  const surveyLanguages = useSurveyLangs()
  const languages = useMemo(
    () => (A.isEmpty(languagesFromProps) ? surveyLanguages : languagesFromProps),
    [languagesFromProps, surveyLanguages]
  )
  const preferredLanguage = useSurveyPreferredLang()
  const languagesSorted = sortLanguages({ languages, preferredLanguage })

  const canToggleEditor = languages.length > MAX_PREVIEW_LANGUAGES
  const languagesToEdit = editingLabels ? languagesSorted : [preferredLanguage]
  const showLanguageBadge = languagesToEdit.length > 1

  const populatedLang = languages.find((lang) => labels[lang] && String(labels[lang]).trim().length > 0)
  const emptyLangs = useMemo(
    () => languages.filter((lang) => !labels[lang] || !String(labels[lang]).trim().length),
    [languages, labels]
  )
  const aiTranslation = useAiFeatureAvailability('translation')
  const canTranslate =
    isAiFeatureShown(aiTranslation) &&
    !readOnly &&
    !translating &&
    editingLabels &&
    surveyId &&
    populatedLang &&
    emptyLangs.length > 0 &&
    onChange

  const onTranslate = useCallback(async () => {
    if (!canTranslate || !isAiFeatureUsable(aiTranslation)) return
    const controller = new AbortController()
    translationAbortRef.current = controller
    setTranslating(true)
    try {
      const result = await AiWorkflows.translateLabels({
        surveyId,
        sourceLang: populatedLang,
        targetLangs: emptyLangs,
        items: [{ id: 'label', text: labels[populatedLang], kind: 'nodeDefLabel' }],
        signal: controller.signal,
      })
      if (controller.signal.aborted) return
      const byLang = result.translations?.[0]?.byLang ?? {}
      const merged = { ...labels }
      for (const [lang, text] of Object.entries(byLang)) {
        if (emptyLangs.includes(lang) && typeof text === 'string') merged[lang] = text
      }
      onChange(merged)
      notifyInfo({ key: 'aiTranslation.success', params: { count: Object.keys(byLang).length } })
    } catch (error) {
      if (!controller.signal.aborted && !isAiAbortError(error)) {
        notifyError({ key: 'aiTranslation.failed', params: { message: getAiErrorMessage({ error, i18n }) } })
      }
    } finally {
      if (!controller.signal.aborted) setTranslating(false)
    }
  }, [
    aiTranslation,
    canTranslate,
    emptyLangs,
    i18n,
    labels,
    notifyError,
    notifyInfo,
    onChange,
    populatedLang,
    surveyId,
  ])

  return (
    <div className={classNames('labels-editor', { 'with-label': showFormLabel })}>
      <div className="labels-editor-label">
        {showFormLabel && <span className="form-label">{i18n.t(formLabelKey, { count: languages.length })}</span>}
        {canToggleEditor && <ButtonToggle onClick={() => setEditingLabels(!editingLabels)} open={editingLabels} />}
        {translating && <Spinner size={18} />}
        {canTranslate && (
          <>
            <AiPolicyBlockedTooltip availability={aiTranslation}>
              <Button
                className="btn-s btn-ai-translate"
                disabled={!isAiFeatureUsable(aiTranslation)}
                iconClassName="icon-earth icon-14px"
                onClick={onTranslate}
                title="aiTranslation.translateButton"
                titleParams={{ count: emptyLangs.length }}
              />
            </AiPolicyBlockedTooltip>
            {isAiFeatureUsable(aiTranslation) && <AiFeatureDataLocationBadge feature="translation" compact />}
          </>
        )}
      </div>
      <div className="labels-editor__labels">
        <ValidationTooltip validation={validation}>
          {languagesToEdit.map((lang, index) => (
            <Label
              key={lang}
              autoFocus={autoFocus && index === 0}
              inputFieldIdPrefix={inputFieldIdPrefix}
              inputType={inputType}
              lang={lang}
              labels={labels}
              onChange={onChange}
              placeholder={i18n.t(placeholder)}
              readOnly={readOnly}
              showLanguageBadge={showLanguageBadge}
              compactLanguage={compactLanguage}
              textTransformFunction={textTransformFunction}
            />
          ))}
        </ValidationTooltip>
      </div>
    </div>
  )
}

LabelsEditor.propTypes = {
  autoFocus: PropTypes.bool,
  compactLanguage: PropTypes.bool,
  formLabelKey: PropTypes.string,
  inputFieldIdPrefix: PropTypes.string,
  inputType: PropTypes.oneOf(['input', 'textarea']),
  languages: PropTypes.array,
  labels: PropTypes.object,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  showFormLabel: PropTypes.bool,
  validation: PropTypes.object,
  textTransformFunction: PropTypes.func,
}

export default LabelsEditor
