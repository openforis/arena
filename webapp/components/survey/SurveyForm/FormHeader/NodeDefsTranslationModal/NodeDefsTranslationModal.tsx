import './NodeDefsTranslationModal.scss'

import { useCallback, useState } from 'react'

import { Button, ButtonIconEdit } from '@webapp/components/buttons'
import Checkbox from '@webapp/components/form/Checkbox'
import { SimpleTextInput } from '@webapp/components/form/SimpleTextInput'
import { useNotifyError, useNotifyInfo } from '@webapp/components/hooks'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/Modal'
import { RadioButton } from '@webapp/components/RadioButton'
import * as API from '@webapp/service/api'
import { useAppDispatch } from '@webapp/store'
import { SurveyActions, useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

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
  // translations the AI did not produce (browser run); absent: none
  failedCount?: number
  // translations a stop kept the run from asking for; absent: none
  notDoneCount?: number
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
  // names the choices for assistive technologies (e.g. "Label (fr)")
  cellLabel: string
  existingValue?: string
  aiValue?: string
  selection: CellSelection
  onChange: (selection: CellSelection) => void
}

const TranslationCell = ({
  cellLabel,
  existingValue = '',
  aiValue = '',
  selection,
  onChange,
}: TranslationCellProps) => {
  const { mode, customValue } = selection
  const [isEditing, setIsEditing] = useState(false)
  const i18n = useI18n()

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

  // the Edit button is gone: the selected choice takes the focus
  return (
    <div aria-label={cellLabel} className="translation-cell" role="radiogroup">
      {existingValue && (
        <div className="translation-option">
          <RadioButton
            autoFocus={mode === translationModes.existing}
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
            autoFocus={mode === translationModes.ai}
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
          autoFocus={mode === translationModes.custom}
          checked={mode === translationModes.custom}
          label="surveyForm:nodeDefsTranslation.custom"
          onClick={() => onModeChange(translationModes.custom)}
          value={translationModes.custom}
        />
        <SimpleTextInput
          className="translation-custom-input"
          disabled={mode !== translationModes.custom}
          inputAttributes={{ 'aria-label': `${i18n.t('surveyForm:nodeDefsTranslation.custom')}: ${cellLabel}` }}
          onFocus={onCustomClick}
          onChange={onCustomValueChange}
          value={mode === translationModes.custom ? customValue : ''}
        />
      </div>
    </div>
  )
}

type DefaultLangCellProps = {
  ariaLabel: string
  value?: string
  onChange: (value: string) => void
}

const DefaultLangCell = ({ ariaLabel, value = '', onChange }: DefaultLangCellProps) => {
  const [isEditing, setIsEditing] = useState(false)

  if (!isEditing) {
    return (
      <div className="default-lang-cell--view">
        <span className="default-lang-cell__value">{value || <em className="translation-cell__empty">—</em>}</span>
        <ButtonIconEdit onClick={() => setIsEditing(true)} />
      </div>
    )
  }

  return <SimpleTextInput value={value} onChange={onChange} autoFocus inputAttributes={{ 'aria-label': ariaLabel }} />
}

type AppliedItem = { nodeDefUuid: string; props: { labels: Record<string, string> } }

type NodeDefsTranslationModalProps = {
  result: JobResult
  onClose: () => void
  // the options below let another label run (category items) use the review: rows are then keyed by its own uuids
  title?: string
  // header of the first column (translated)
  pathHeader?: string
  // labels only: no descriptions, and the source label is read-only
  labelsOnly?: boolean
  // saves the reviewed labels instead of the node defs request (it also notifies)
  onApplyLabels?: (items: AppliedItem[]) => Promise<void>
}

const NodeDefsTranslationModal = ({
  result,
  onClose,
  title = 'surveyForm:nodeDefsTranslation.title',
  pathHeader,
  labelsOnly = false,
  onApplyLabels,
}: NodeDefsTranslationModalProps) => {
  const { defaultLang, otherLangs, items, failedCount = 0, notDoneCount = 0 } = result

  const rootPrefix = items.find((item) => !item.path.includes(' / '))?.path
  const displayPath = (path: string) =>
    rootPrefix && path !== rootPrefix && path.startsWith(`${rootPrefix} / `) ? path.slice(rootPrefix.length + 3) : path

  const dispatch = useAppDispatch()
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

      if (onApplyLabels) {
        await onApplyLabels(nodeDefs)
      } else {
        await API.putNodeDefsProps({ surveyId, nodeDefs, cycle })
        notifyInfo({ key: 'surveyForm:nodeDefsTranslation.applySuccess' })
        dispatch(SurveyActions.resetSurveyDefs())
      }
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
    onApplyLabels,
    onClose,
    otherLangs,
    selections,
    surveyId,
  ])

  const onToggleDescriptions = useCallback((checked: boolean) => setShowDescriptions(checked), [])

  return (
    <Modal className="node-defs-translation-modal" onClose={onClose} showCloseButton title={title}>
      <ModalBody>
        {!labelsOnly && (
          <div className="node-defs-translation-modal__toolbar">
            <Checkbox
              checked={showDescriptions}
              label="surveyForm:nodeDefsTranslation.showDescriptions"
              onChange={onToggleDescriptions}
            />
          </div>
        )}
        {failedCount > 0 && (
          <output className="node-defs-translation-modal__failed" data-testid={TestId.ai.translationFailedNotice}>
            {i18n.t('surveyForm:nodeDefsTranslation.failed', { count: failedCount })}
          </output>
        )}
        {notDoneCount > 0 && (
          <output className="node-defs-translation-modal__failed">
            {i18n.t('surveyForm:nodeDefsTranslation.notDone', { count: notDoneCount })}
          </output>
        )}
        <div className="node-defs-translation-modal__table-wrapper">
          <table className="node-defs-translation-modal__table">
            <thead>
              <tr>
                <th>{pathHeader ?? i18n.t('surveyForm:nodeDefsTranslation.path')}</th>
                <th>
                  {i18n.t(labelsOnly ? 'common.label' : 'surveyForm:nodeDefsTranslation.defaultLabel')} ({defaultLang})
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
                      {labelsOnly ? (
                        defaultValues.label
                      ) : (
                        <DefaultLangCell
                          ariaLabel={`${i18n.t('surveyForm:nodeDefsTranslation.defaultLabel')} (${defaultLang})`}
                          value={defaultValues.label}
                          onChange={(value) => updateDefaultLangValue(nodeDefUuid, 'label', value)}
                        />
                      )}
                    </td>
                    {otherLangs.map((lang) => (
                      <td key={`label-${nodeDefUuid}-${lang}`}>
                        <TranslationCell
                          cellLabel={`${i18n.t('common.label')} (${lang})`}
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
                            ariaLabel={`${i18n.t('surveyForm:nodeDefsTranslation.defaultDescription')} (${defaultLang})`}
                            value={defaultValues.description}
                            onChange={(value) => updateDefaultLangValue(nodeDefUuid, 'description', value)}
                          />
                        </td>
                        {otherLangs.map((lang) => (
                          <td key={`desc-${nodeDefUuid}-${lang}`}>
                            <TranslationCell
                              cellLabel={`${i18n.t('common.description')} (${lang})`}
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
          onClick={() => void onApply()}
          variant="contained"
        />
      </ModalFooter>
    </Modal>
  )
}

export default NodeDefsTranslationModal
