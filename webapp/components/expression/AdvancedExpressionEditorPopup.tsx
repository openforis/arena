import './ExpressionEditorPopup.scss'

import { useCallback, useMemo, useState } from 'react'
import { autocompletion } from '@codemirror/autocomplete'
import { javascript } from '@codemirror/lang-javascript'
import ReactCodeMirror from '@uiw/react-codemirror'

import type { ArenaAnyNodeDef } from '@openforis/arena-core'

import * as Expression from '@core/expressionParser/expression'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpressionValidator from '@core/survey/nodeDefExpressionValidator'
import { useSurvey } from '@webapp/store/survey'
import { useI18n, useI18nT } from '@webapp/store/system'

import { useAutocompletionSource } from './useAutocompletionSource'

const codeMirrorBasicSetup = { foldGutter: false, lineNumbers: false }

const completionsCompareFn = (contextUuid) => (completionA, completionB) => {
  const { apply: applyA, label: labelA, parentUuid: parentUuidA, type: typeA } = completionA
  const { apply: applyB, label: labelB, parentUuid: parentUuidB, type: typeB } = completionB
  const typeComparison = typeB.localeCompare(typeA)
  if (typeComparison === 0 && typeA === 'variable') {
    if (applyA === Expression.thisVariable) return -1
    if (applyB === Expression.thisVariable) return 1
    if (parentUuidA !== parentUuidB) {
      if (parentUuidA === contextUuid) return -1
      if (parentUuidB === contextUuid) return 1
    }
  }
  return typeComparison || labelA.localeCompare(labelB)
}

type AdvancedExpressionEditorPopupProps = {
  excludeCurrentNodeDef?: boolean
  includeAnalysis?: boolean
  isContextParent?: boolean
  mode?: string
  nodeDefCurrent?: ArenaAnyNodeDef
  query?: string // String representing the expression
  textSearchHelpVisible?: boolean
  updateDraftQuery: (...args: any[]) => any
}

const AdvancedExpressionEditorPopup = (props: AdvancedExpressionEditorPopupProps) => {
  const {
    excludeCurrentNodeDef = true,
    includeAnalysis = false,
    isContextParent = false,
    mode = Expression.modes.json,
    nodeDefCurrent = null,
    query = '',
    textSearchHelpVisible = false,
    updateDraftQuery,
  } = props

  const i18n = useI18n()
  // validation errors can include operators like &&
  const tUnescaped = useI18nT({ unescapeHtml: true })
  const survey = useSurvey()
  const nodeDefCurrentParentUuid = NodeDef.getParentUuid(nodeDefCurrent)

  const [errorMessage, setErrorMessage] = useState(null)

  const autocompletionSource = useAutocompletionSource({
    mode,
    nodeDefCurrent,
    isContextParent,
    includeAnalysis,
  })

  const codeMirrorExtensions = useMemo(
    () => [
      javascript(),
      autocompletion({
        closeOnBlur: true,
        // add a carriage return after the label in the rendered item option
        addToOptions: [
          {
            render: () => document.createElement('br'),
            position: 60,
          },
        ],
        compareCompletions: completionsCompareFn(nodeDefCurrentParentUuid),
        override: [autocompletionSource],
        optionClass: (completion) => `cm-completion-option ${completion.type}`,
      }),
    ],
    [autocompletionSource, nodeDefCurrentParentUuid]
  )

  const validateEditorValue = useCallback(
    async (value) => {
      const newErrorMessage =
        value === ''
          ? null
          : await NodeDefExpressionValidator.validate({
              survey,
              nodeDefCurrent,
              exprString: value,
              selfReferenceAllowed: !excludeCurrentNodeDef,
              includeAnalysis,
            })
      setErrorMessage(newErrorMessage)
      const valid = !newErrorMessage
      return valid
    },
    [excludeCurrentNodeDef, includeAnalysis, nodeDefCurrent, survey]
  )

  const onEditorChange = useCallback(
    async (value) => {
      const valueTrimmed = value.trim()
      const valid = await validateEditorValue(valueTrimmed)
      if (valid && valueTrimmed !== query) {
        updateDraftQuery(valueTrimmed)
      }
    },
    [query, updateDraftQuery, validateEditorValue]
  )

  return (
    <>
      <div className="expression-editor__query-container">
        {errorMessage && <div className="query invalid">{tUnescaped(errorMessage.key, errorMessage.params)}</div>}
      </div>
      <div className="expression-editor-popup__expr-container">
        <ReactCodeMirror
          autoFocus
          basicSetup={codeMirrorBasicSetup}
          extensions={codeMirrorExtensions}
          onChange={onEditorChange}
          value={query}
        />
      </div>
      <div className="expression-editor-popup__editor-help">
        {/* expressions are always written in JavaScript syntax, also when converted into SQL */}
        <p>{i18n.t(`nodeDefEdit:editorHelp.${Expression.modes.json}`)}</p>
        {textSearchHelpVisible && <p>{i18n.t('nodeDefEdit:editorTextSearchHelp')}</p>}
        <p>
          <kbd>Ctrl</kbd>+<kbd>Space</kbd> {i18n.t('nodeDefEdit:editorCompletionHelp')}
        </p>
      </div>
    </>
  )
}

export default AdvancedExpressionEditorPopup
