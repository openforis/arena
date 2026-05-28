import './LabelsEditor.scss'

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import * as A from '@core/arena'
import classNames from 'classnames'

import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'
import { useSurveyLangs, useSurveyPreferredLang, useSurveyId } from '@webapp/store/survey'
import { useNotifyInfo, useNotifyError } from '@webapp/components/hooks'

import { Button } from '@webapp/components/buttons'
import ValidationTooltip from '@webapp/components/validationTooltip'
import { useAiFeatureEnabled } from '@webapp/components/ai/hooks/useAiFeatureEnabled'

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
  const surveyLanguages = useSurveyLangs()
  const languages = !A.isEmpty(languagesFromProps) ? languagesFromProps : surveyLanguages
  const preferredLanguage = useSurveyPreferredLang()
  const languagesSorted = sortLanguages({ languages, preferredLanguage })

  const canToggleEditor = languages.length > MAX_PREVIEW_LANGUAGES
  const languagesToEdit = editingLabels ? languagesSorted : [preferredLanguage]
  const showLanguageBadge = languagesToEdit.length > 1

  const populatedLang = languages.find((lang) => labels[lang] && String(labels[lang]).trim().length > 0)
  const emptyLangs = languages.filter((lang) => !labels[lang] || !String(labels[lang]).trim().length)
  const aiTranslationEnabled = useAiFeatureEnabled('translation')
  const canTranslate =
    aiTranslationEnabled &&
    !readOnly &&
    !translating &&
    editingLabels &&
    surveyId &&
    populatedLang &&
    emptyLangs.length > 0 &&
    onChange

  const onTranslate = async () => {
    if (!canTranslate) return
    setTranslating(true)
    try {
      const result = await API.aiTranslation.translate({
        surveyId,
        sourceLang: populatedLang,
        targetLangs: emptyLangs,
        items: [{ id: 'label', text: labels[populatedLang], kind: 'nodeDefLabel' }],
      })
      const byLang = result?.translations?.[0]?.byLang || {}
      const merged = { ...labels }
      Object.entries(byLang).forEach(([lang, text]) => {
        if (emptyLangs.includes(lang) && typeof text === 'string') {
          merged[lang] = text
        }
      })
      onChange(merged)
      notifyInfo({ key: 'aiTranslation.success', params: { count: Object.keys(byLang).length } })
    } catch (err) {
      const message = err?.response?.data?.error?.key || err?.message || 'unknown'
      notifyError({ key: 'aiTranslation.failed', params: { message } })
    } finally {
      setTranslating(false)
    }
  }

  return (
    <div className={classNames('labels-editor', { 'with-label': showFormLabel })}>
      <div className="labels-editor-label">
        {showFormLabel && <span className="form-label">{i18n.t(formLabelKey, { count: languages.length })}</span>}
        {canToggleEditor && <ButtonToggle onClick={() => setEditingLabels(!editingLabels)} open={editingLabels} />}
        {canTranslate && (
          <Button
            className="btn-s btn-ai-translate"
            iconClassName="icon-earth icon-14px"
            onClick={onTranslate}
            disabled={translating}
            title={i18n.t('aiTranslation.translateButton', { count: emptyLangs.length })}
          />
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
