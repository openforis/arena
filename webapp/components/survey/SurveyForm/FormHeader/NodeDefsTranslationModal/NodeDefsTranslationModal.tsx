import './NodeDefsTranslationModal.scss'

import React, { useCallback, useState } from 'react'
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

type TranslationMode = 'existing' | 'ai' | 'custom'

const translationModes: Record<TranslationMode, TranslationMode> = {
  existing: 'existing',
  ai: 'ai',
  custom: 'custom',
}

type CellSelection = {
  mode: TranslationMode
  customValue: string
}

type TranslationItem = {
  nodeDefUuid: string
  path: string
  defaultLangLabel: string
  defaultLangDescription: string
  existingLabelsByLang: Record<string, string>
  existingDescriptionsByLang: Record<string, string>
  aiLabelsByLang: Record<string, string>
  aiDescriptionsByLang: Record<string, string>
}

type JobResult = {
  defaultLang: string
  languages: string[]
  otherLangs: string[]
  items: TranslationItem[]
}

type PerLangSelections = Record<string, CellSelection>

type ItemSelections = {
  labels: PerLangSelections
  descs: PerLangSelections
}

type SelectionsState = Record<string, ItemSelections>

type DefaultLangValuesState = Record<string, { label: string; description: string }>

const resolveValue = (selection: CellSelection, existingValue: string, aiValue: string): string => {
  if (selection.mode === translationModes.existing) return existingValue || ''
  if (selection.mode === translationModes.ai) return aiValue || ''
  return selection.customValue
}

const buildCellSelection = (existingValue: string, aiValue: string = ''): CellSelection => {
  const existing = existingValue || ''
  if (existing) return { mode: translationModes.existing, customValue: existing }
  if (aiValue) return { mode: translationModes.ai, customValue: aiValue }
  return { mode: translationModes.custom, customValue: '' }
}

const buildInitialSelections = (items: TranslationItem[], otherLangs: string[]): SelectionsState =>
  Object.fromEntries(
    items.map((item) => [
      item.nodeDefUuid,
      {
        labels: Object.fromEntries(
          otherLangs.map((lang) => [
            lang,
            buildCellSelection(item.existingLabelsByLang[lang], item.aiLabelsByLang[lang]),
          ])
        ),
        descs: Object.fromEntries(
          otherLangs.map((lang) => [
            lang,
            buildCellSelection(item.existingDescriptionsByLang[lang], item.aiDescriptionsByLang[lang]),
          ])
        ),
      },
    ])
  )

type TranslationCellProps = {
  cellId: string
  existingValue?: string
  aiValue?: string
  selection: CellSelection
  onChange: (selection: CellSelection) => void
}

const TranslationCell = ({
  cellId: _cellId,
  existingValue = '',
  aiValue = '',
  selection,
  onChange,
}: TranslationCellProps) => {
  const { mode, customValue } = selection
  const [isEditing, setIsEditing] = useState(false)

  const onModeChange = useCallback(
    (newMode: TranslationMode) => onChange({ mode: newMode, customValue }),
    [customValue, onChange]
  )

  const onCustomValueChange = useCallback(
    (value: string) => onChange({ mode: translationModes.custom, customValue: value }),
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
            label="surveyForm:nodeDefsTranslation.current"
            onClick={() => onModeChange(translationModes.existing)}
            value={translationModes.existing}
          />
          <span className="option-text">{existingValue}</span>
        </div>
      )}
      {aiValue && (
        <div className="translation-option">
          <RadioButton
            checked={mode === translationModes.ai}
            label="surveyForm:nodeDefsTranslation.aiSuggestion"
            onClick={() => onModeChange(translationModes.ai)}
            value={translationModes.ai}
          />
          <span className="option-text">{aiValue}</span>
        </div>
      )}
      <div className="translation-option translation-option--custom">
        <RadioButton
          checked={mode === translationModes.custom}
          label="surveyForm:nodeDefsTranslation.custom"
          onClick={() => onModeChange(translationModes.custom)}
          value={translationModes.custom}
        />
        <SimpleTextInput
          className="translation-custom-input"
          disabled={mode !== translationModes.custom}
          onFocus={onCustomClick}
          onChange={onCustomValueChange}
          value={mode === translationModes.custom ? customValue : ''}
        />
      </div>
    </div>
  )
}

type DefaultLangCellProps = {
  value?: string
  onChange: (value: string) => void
}

const DefaultLangCell = ({ value = '', onChange }: DefaultLangCellProps) => {
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

type NodeDefsTranslationModalProps = {
  result: JobResult
  onClose: () => void
}

const NodeDefsTranslationModal = ({ result, onClose }: NodeDefsTranslationModalProps) => {
  const { defaultLang, otherLangs, items } = result

  const rootPrefix = items.find((item) => !item.path.includes(' / '))?.path
  const displayPath = (path: string) =>
    rootPrefix && path !== rootPrefix && path.startsWith(`${rootPrefix} / `) ? path.slice(rootPrefix.length + 3) : path

  const dispatch = useDispatch()
  const i18n = useI18n()
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const notifyInfo = useNotifyInfo()
  const notifyError = useNotifyError()

  const [isSaving, setIsSaving] = useState(false)
  const [showDescriptions, setShowDescriptions] = useState(false)
  const [selections, setSelections] = useState<SelectionsState>(() => buildInitialSelections(items, otherLangs))
  const [defaultLangValues, setDefaultLangValues] = useState<DefaultLangValuesState>(() => {
    const state: DefaultLangValuesState = {}
    for (const item of items) {
      state[item.nodeDefUuid] = { label: item.defaultLangLabel || '', description: item.defaultLangDescription || '' }
    }
    return state
  })

  const updateDefaultLangValue = useCallback((nodeDefUuid: string, field: 'label' | 'description', value: string) => {
    setDefaultLangValues((prev) => ({ ...prev, [nodeDefUuid]: { ...prev[nodeDefUuid], [field]: value } }))
  }, [])

  const updateSelection = useCallback(
    (nodeDefUuid: string, field: 'labels' | 'descs', lang: string, newSelection: CellSelection) => {
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
    },
    []
  )

  const onApply = useCallback(async () => {
    setIsSaving(true)
    try {
      const nodeDefs = items.map((item) => {
        const { nodeDefUuid, existingLabelsByLang, existingDescriptionsByLang, aiLabelsByLang, aiDescriptionsByLang } =
          item
        const itemSelections = selections[nodeDefUuid]
        const effectiveDefaultLabel = defaultLangValues[nodeDefUuid].label
        const effectiveDefaultDesc = defaultLangValues[nodeDefUuid].description

        const labels: Record<string, string> = { [defaultLang]: effectiveDefaultLabel }
        const descriptions: Record<string, string> = {}

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

        const props: { labels: Record<string, string>; descriptions?: Record<string, string> } = { labels }
        if (Object.keys(descriptions).length > 0) {
          props.descriptions = descriptions
        }
        return { nodeDefUuid, props }
      })

      await API.putNodeDefsProps({ surveyId, nodeDefs, cycle })

      notifyInfo({ key: 'surveyForm:nodeDefsTranslation.applySuccess' })
      dispatch(SurveyActions.resetSurveyDefs())
      onClose()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'unknown'
      notifyError({ key: 'appErrors:generic', params: { text: message } })
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

  const onToggleDescriptions = useCallback((checked: boolean) => setShowDescriptions(checked), [])

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

export default NodeDefsTranslationModal
