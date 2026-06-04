import './NodeDefsTranslationModal.scss'

import React, { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'
import { SurveyActions, useSurveyId, useSurveyCycleKey } from '@webapp/store/survey'
import { useNotifyInfo, useNotifyError } from '@webapp/components/hooks'
import { Button } from '@webapp/components/buttons'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'

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
        mode: existingLabel ? translationModes.existing : translationModes.ai,
        customValue: existingLabel || aiLabel,
      }
      const existingDesc = item.existingDescriptionsByLang[lang] || ''
      const aiDesc = item.aiDescriptionsByLang[lang] || ''
      state[item.nodeDefUuid].descs[lang] = {
        mode: existingDesc ? translationModes.existing : translationModes.ai,
        customValue: existingDesc || aiDesc,
      }
    }
  }
  return state
}

/**
 * Single translation choice cell with radio options (existing / AI / custom).
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

  const onModeChange = useCallback((newMode) => onChange({ mode: newMode, customValue }), [customValue, onChange])

  const onCustomValueChange = useCallback(
    (e) => onChange({ mode: translationModes.custom, customValue: e.target.value }),
    [onChange]
  )

  const onCustomClick = useCallback(() => onModeChange(translationModes.custom), [onModeChange])

  return (
    <div className="translation-cell">
      {existingValue && (
        <label className="translation-option">
          <input
            type="radio"
            name={cellId}
            value={translationModes.existing}
            checked={mode === translationModes.existing}
            onChange={() => onModeChange(translationModes.existing)}
          />
          <span className="option-badge option-badge--existing">
            {i18n.t('surveyForm:nodeDefsTranslation.current')}
          </span>
          <span className="option-text">{existingValue}</span>
        </label>
      )}
      {aiValue && (
        <label className="translation-option">
          <input
            type="radio"
            name={cellId}
            value={translationModes.ai}
            checked={mode === translationModes.ai}
            onChange={() => onModeChange(translationModes.ai)}
          />
          <span className="option-badge option-badge--ai">{i18n.t('surveyForm:nodeDefsTranslation.aiSuggestion')}</span>
          <span className="option-text">{aiValue}</span>
        </label>
      )}
      <label className="translation-option translation-option--custom">
        <input
          type="radio"
          name={cellId}
          value={translationModes.custom}
          checked={mode === translationModes.custom}
          onChange={() => onModeChange(translationModes.custom)}
        />
        <span className="option-badge">{i18n.t('surveyForm:nodeDefsTranslation.custom')}</span>
        <input
          className="translation-custom-input"
          type="text"
          value={mode === translationModes.custom ? customValue : ''}
          disabled={mode !== translationModes.custom}
          onClick={onCustomClick}
          onChange={onCustomValueChange}
        />
      </label>
    </div>
  )
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

  const dispatch = useDispatch()
  const i18n = useI18n()
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const notifyInfo = useNotifyInfo()
  const notifyError = useNotifyError()

  const [isSaving, setIsSaving] = useState(false)
  const [showDescriptions, setShowDescriptions] = useState(false)
  const [selections, setSelections] = useState(() => buildInitialSelections(items, otherLangs))

  const hasDescriptions = useMemo(() => items.some((item) => item.defaultLangDescription), [items])

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
        const {
          nodeDefUuid,
          defaultLangLabel,
          defaultLangDescription,
          existingLabelsByLang,
          existingDescriptionsByLang,
          aiLabelsByLang,
          aiDescriptionsByLang,
        } = item
        const itemSelections = selections[nodeDefUuid]

        const labels = { [defaultLang]: defaultLangLabel }
        const descriptions = {}

        if (defaultLangDescription) {
          descriptions[defaultLang] = defaultLangDescription
        }

        for (const lang of otherLangs) {
          labels[lang] = resolveValue(itemSelections.labels[lang], existingLabelsByLang[lang], aiLabelsByLang[lang])
          const descValue = resolveValue(
            itemSelections.descs[lang],
            existingDescriptionsByLang[lang],
            aiDescriptionsByLang[lang]
          )
          if (defaultLangDescription || descValue) {
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
  }, [cycle, defaultLang, dispatch, items, notifyError, notifyInfo, onClose, otherLangs, selections, surveyId])

  const onToggleDescriptions = useCallback((e) => setShowDescriptions(e.target.checked), [])

  return (
    <Modal
      className="node-defs-translation-modal"
      onClose={onClose}
      showCloseButton
      title="surveyForm:nodeDefsTranslation.title"
    >
      <ModalBody>
        {hasDescriptions && (
          <div className="node-defs-translation-modal__toolbar">
            <label className="node-defs-translation-modal__show-descriptions">
              <input type="checkbox" checked={showDescriptions} onChange={onToggleDescriptions} />
              {i18n.t('surveyForm:nodeDefsTranslation.showDescriptions')}
            </label>
          </div>
        )}
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
                  defaultLangLabel,
                  defaultLangDescription,
                  existingLabelsByLang,
                  existingDescriptionsByLang,
                  aiLabelsByLang,
                  aiDescriptionsByLang,
                } = item
                const itemSels = selections[nodeDefUuid]
                return (
                  <tr key={nodeDefUuid}>
                    <td className="path-cell">{path}</td>
                    <td className="default-value-cell">{defaultLangLabel}</td>
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
                        <td className="default-value-cell">{defaultLangDescription}</td>
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
