import './NodeDefsTranslationModal.scss'

import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'
import { SurveyActions, useSurveyId, useSurveyCycleKey } from '@webapp/store/survey'
import { useNotifyInfo, useNotifyError } from '@webapp/components/hooks'
import { Button, ButtonIconEdit } from '@webapp/components/buttons'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { RadioButton } from '@webapp/components/RadioButton'
import Checkbox from '@webapp/components/form/checkbox'
import { SimpleTextInput } from '@webapp/components/form/SimpleTextInput'

const translationModes = {
  existing: 'existing',
  ai: 'ai',
  custom: 'custom',
}

/**
 * Resolves the translated string from a cell selection.
 * @param {object} selection - Cell selection state.
 * @param {string} existingValue - The existing translation.
 * @param {string} aiValue - The AI-generated translation.
 * @returns {string} The resolved translation string.
 */
const resolveValue = (selection, existingValue, aiValue) => {
  if (selection.mode === translationModes.existing) return existingValue || ''
  if (selection.mode === translationModes.ai) return aiValue || ''
  return selection.customValue
}

/**
 * Builds the initial per-cell selection state from the job result items.
 * @param {Array} items - Job result items.
 * @param {string[]} otherLangs - Non-default language codes.
 * @returns {object} Selection state keyed by nodeDefUuid.
 */
const buildInitialSelections = (items, otherLangs) => {
  const state = {}
  for (const item of items) {
    state[item.nodeDefUuid] = { labels: {}, descs: {} }
    for (const lang of otherLangs) {
      const existingLabel = item.existingLabelsByLang[lang] || ''
      const aiLabel = item.aiLabelsByLang[lang] || ''
      state[item.nodeDefUuid].labels[lang] = {
        mode: existingLabel ? translationModes.existing : aiLabel ? translationModes.ai : translationModes.custom,
        customValue: existingLabel || aiLabel,
      }
      const existingDesc = item.existingDescriptionsByLang[lang] || ''
      const aiDesc = item.aiDescriptionsByLang[lang] || ''
      state[item.nodeDefUuid].descs[lang] = {
        mode: existingDesc ? translationModes.existing : aiDesc ? translationModes.ai : translationModes.custom,
        customValue: existingDesc || aiDesc,
      }
    }
  }
  return state
}

/**
 * Single translation choice cell with radio options (existing / AI / custom).
 * Starts in view mode showing the resolved value; an edit icon switches to full edit mode.
 * @param {object} props - Component props.
 * @param {string} props.cellId - Unique radio group name.
 * @param {string} props.existingValue - Existing translation value.
 * @param {string} props.aiValue - AI-generated translation value.
 * @param {object} props.selection - Current selection state {mode, customValue}.
 * @param {Function} props.onChange - Callback invoked with updated selection.
 * @returns {React.ReactElement} The translation cell.
 */
const TranslationCell = ({ cellId, existingValue, aiValue, selection, onChange }) => {
  const i18n = useI18n()
  const { mode, customValue } = selection
  const [isEditing, setIsEditing] = useState(false)

  const onModeChange = useCallback((newMode) => onChange({ mode: newMode, customValue }), [customValue, onChange])

  const onCustomValueChange = useCallback(
    (value) => onChange({ mode: translationModes.custom, customValue: value }),
    [onChange]
  )

  const onCustomClick = useCallback(() => onModeChange(translationModes.custom), [onModeChange])

  const resolvedValue = resolveValue(selection, existingValue, aiValue)

  if (!isEditing) {
    return (
      <div className="translation-cell translation-cell--view">
        <span className="translation-cell__value">
          {resolvedValue || <em className="translation-cell__empty">—</em>}
        </span>
        <ButtonIconEdit onClick={() => setIsEditing(true)} />
      </div>
    )
  }

  return (
    <div className="translation-cell">
      {existingValue && (
        <div className="translation-option">
          <RadioButton
            checked={mode === translationModes.existing}
            onClick={() => onModeChange(translationModes.existing)}
            label="surveyForm:nodeDefsTranslation.current"
          />
          <span className="option-text">{existingValue}</span>
        </div>
      )}
      {aiValue && (
        <div className="translation-option">
          <RadioButton
            checked={mode === translationModes.ai}
            onClick={() => onModeChange(translationModes.ai)}
            label="surveyForm:nodeDefsTranslation.aiSuggestion"
          />
          <span className="option-text">{aiValue}</span>
        </div>
      )}
      <div className="translation-option translation-option--custom">
        <RadioButton
          checked={mode === translationModes.custom}
          onClick={() => onModeChange(translationModes.custom)}
          label="surveyForm:nodeDefsTranslation.custom"
        />
        <SimpleTextInput
          className="translation-custom-input"
          value={mode === translationModes.custom ? customValue : ''}
          disabled={mode !== translationModes.custom}
          onFocus={onCustomClick}
          onChange={onCustomValueChange}
        />
      </div>
    </div>
  )
}

/**
 * Editable cell for the default-language label/description.
 * Starts in view mode; clicking the edit icon reveals the text input.
 * @param {object} props - Component props.
 * @param {string} props.value - Current text value.
 * @param {Function} props.onChange - Callback invoked with the synthetic event.
 * @returns {React.ReactElement} The cell.
 */
const DefaultLangCell = ({ value, onChange }) => {
  const [isEditing, setIsEditing] = useState(false)

  if (!isEditing) {
    return (
      <div className="default-lang-cell--view">
        <span className="default-lang-cell__value">{value || <em className="translation-cell__empty">—</em>}</span>
        <ButtonIconEdit onClick={() => setIsEditing(true)} />
      </div>
    )
  }

  return <SimpleTextInput value={value} onChange={onChange} autoFocus />
}

DefaultLangCell.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
}

DefaultLangCell.defaultProps = {
  value: '',
}

TranslationCell.propTypes = {
  cellId: PropTypes.string.isRequired,
  existingValue: PropTypes.string,
  aiValue: PropTypes.string,
  selection: PropTypes.shape({ mode: PropTypes.string, customValue: PropTypes.string }).isRequired,
  onChange: PropTypes.func.isRequired,
}

TranslationCell.defaultProps = {
  existingValue: '',
  aiValue: '',
}

/**
 * Modal that displays the AI-generated node definition label/description
 * translations for user review. The user can choose among the existing
 * translation, the AI suggestion, or a custom value per cell, then apply
 * all confirmed translations in one bulk request.
 * @param {object} props - Component props.
 * @param {object} props.result - Job result from NodeDefsTranslationJob.
 * @param {Function} props.onClose - Callback invoked to close the modal.
 * @returns {React.ReactElement} The modal component.
 */
const NodeDefsTranslationModal = ({ result, onClose }) => {
  const { defaultLang, otherLangs, items } = result

  const rootPrefix = items.find((item) => !item.path.includes(' / '))?.path
  const displayPath = (path) =>
    rootPrefix && path !== rootPrefix && path.startsWith(`${rootPrefix} / `) ? path.slice(rootPrefix.length + 3) : path

  const dispatch = useDispatch()
  const i18n = useI18n()
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const notifyInfo = useNotifyInfo()
  const notifyError = useNotifyError()

  const [isSaving, setIsSaving] = useState(false)
  const [showDescriptions, setShowDescriptions] = useState(false)
  const [selections, setSelections] = useState(() => buildInitialSelections(items, otherLangs))
  const [defaultLangValues, setDefaultLangValues] = useState(() => {
    const state = {}
    for (const item of items) {
      state[item.nodeDefUuid] = { label: item.defaultLangLabel || '', description: item.defaultLangDescription || '' }
    }
    return state
  })

  const updateDefaultLangValue = useCallback((nodeDefUuid, field, value) => {
    setDefaultLangValues((prev) => ({ ...prev, [nodeDefUuid]: { ...prev[nodeDefUuid], [field]: value } }))
  }, [])

  const updateSelection = useCallback((nodeDefUuid, field, lang, newSelection) => {
    setSelections((prev) => ({
      ...prev,
      [nodeDefUuid]: {
        ...prev[nodeDefUuid],
        [field]: {
          ...prev[nodeDefUuid][field],
          [lang]: newSelection,
        },
      },
    }))
  }, [])

  const onApply = useCallback(async () => {
    setIsSaving(true)
    try {
      const nodeDefs = items.map((item) => {
        const { nodeDefUuid, existingLabelsByLang, existingDescriptionsByLang, aiLabelsByLang, aiDescriptionsByLang } =
          item
        const itemSelections = selections[nodeDefUuid]
        const effectiveDefaultLabel = defaultLangValues[nodeDefUuid].label
        const effectiveDefaultDesc = defaultLangValues[nodeDefUuid].description

        const labels = { [defaultLang]: effectiveDefaultLabel }
        const descriptions = {}

        if (effectiveDefaultDesc) {
          descriptions[defaultLang] = effectiveDefaultDesc
        }

        for (const lang of otherLangs) {
          labels[lang] = resolveValue(itemSelections.labels[lang], existingLabelsByLang[lang], aiLabelsByLang[lang])
          const descValue = resolveValue(
            itemSelections.descs[lang],
            existingDescriptionsByLang[lang],
            aiDescriptionsByLang[lang]
          )
          if (effectiveDefaultDesc || descValue) {
            descriptions[lang] = descValue
          }
        }

        const props = { labels }
        if (Object.keys(descriptions).length > 0) {
          props.descriptions = descriptions
        }
        return { nodeDefUuid, props }
      })

      await API.putNodeDefsProps({ surveyId, nodeDefs, cycle })

      notifyInfo({ key: 'surveyForm:nodeDefsTranslation.applySuccess' })
      dispatch(SurveyActions.resetSurveyDefs())
      onClose()
    } catch (error) {
      notifyError({ key: 'appErrors:generic', params: { text: error?.message ?? 'unknown' } })
    } finally {
      setIsSaving(false)
    }
  }, [
    cycle,
    defaultLang,
    defaultLangValues,
    dispatch,
    items,
    notifyError,
    notifyInfo,
    onClose,
    otherLangs,
    selections,
    surveyId,
  ])

  const onToggleDescriptions = useCallback((checked) => setShowDescriptions(checked), [])

  return (
    <Modal
      className="node-defs-translation-modal"
      onClose={onClose}
      showCloseButton
      title="surveyForm:nodeDefsTranslation.title"
    >
      <ModalBody>
        <div className="node-defs-translation-modal__toolbar">
          <Checkbox
            checked={showDescriptions}
            label="surveyForm:nodeDefsTranslation.showDescriptions"
            onChange={onToggleDescriptions}
          />
        </div>
        <div className="node-defs-translation-modal__table-wrapper">
          <table className="node-defs-translation-modal__table">
            <thead>
              <tr>
                <th>{i18n.t('surveyForm:nodeDefsTranslation.path')}</th>
                <th>
                  {i18n.t('surveyForm:nodeDefsTranslation.defaultLabel')} ({defaultLang})
                </th>
                {otherLangs.map((lang) => (
                  <th key={`label-header-${lang}`}>
                    {i18n.t('common.label')} ({lang})
                  </th>
                ))}
                {showDescriptions && (
                  <>
                    <th>
                      {i18n.t('surveyForm:nodeDefsTranslation.defaultDescription')} ({defaultLang})
                    </th>
                    {otherLangs.map((lang) => (
                      <th key={`desc-header-${lang}`}>
                        {i18n.t('common.description')} ({lang})
                      </th>
                    ))}
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const {
                  nodeDefUuid,
                  path,
                  existingLabelsByLang,
                  existingDescriptionsByLang,
                  aiLabelsByLang,
                  aiDescriptionsByLang,
                } = item
                const itemSels = selections[nodeDefUuid]
                const defaultValues = defaultLangValues[nodeDefUuid]
                return (
                  <tr key={nodeDefUuid}>
                    <td className="path-cell">{displayPath(path)}</td>
                    <td className="default-value-cell">
                      <DefaultLangCell
                        value={defaultValues.label}
                        onChange={(value) => updateDefaultLangValue(nodeDefUuid, 'label', value)}
                      />
                    </td>
                    {otherLangs.map((lang) => (
                      <td key={`label-${nodeDefUuid}-${lang}`}>
                        <TranslationCell
                          cellId={`${nodeDefUuid}_label_${lang}`}
                          existingValue={existingLabelsByLang[lang]}
                          aiValue={aiLabelsByLang[lang]}
                          selection={itemSels.labels[lang]}
                          onChange={(sel) => updateSelection(nodeDefUuid, 'labels', lang, sel)}
                        />
                      </td>
                    ))}
                    {showDescriptions && (
                      <>
                        <td className="default-value-cell">
                          <DefaultLangCell
                            value={defaultValues.description}
                            onChange={(value) => updateDefaultLangValue(nodeDefUuid, 'description', value)}
                          />
                        </td>
                        {otherLangs.map((lang) => (
                          <td key={`desc-${nodeDefUuid}-${lang}`}>
                            <TranslationCell
                              cellId={`${nodeDefUuid}_desc_${lang}`}
                              existingValue={existingDescriptionsByLang[lang]}
                              aiValue={aiDescriptionsByLang[lang]}
                              selection={itemSels.descs[lang]}
                              onChange={(sel) => updateSelection(nodeDefUuid, 'descs', lang, sel)}
                            />
                          </td>
                        ))}
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button label="common.cancel" onClick={onClose} variant="outlined" />
        <Button
          disabled={isSaving}
          iconClassName="icon-checkmark icon-14px"
          label="surveyForm:nodeDefsTranslation.apply"
          onClick={onApply}
          variant="contained"
        />
      </ModalFooter>
    </Modal>
  )
}

NodeDefsTranslationModal.propTypes = {
  result: PropTypes.shape({
    defaultLang: PropTypes.string.isRequired,
    languages: PropTypes.arrayOf(PropTypes.string).isRequired,
    otherLangs: PropTypes.arrayOf(PropTypes.string).isRequired,
    items: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
}

export default NodeDefsTranslationModal
