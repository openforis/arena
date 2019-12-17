import './expressionEditorPopup.scss'

import React, { useState, useRef } from 'react'
import { connect } from 'react-redux'
import getCaretCoordinates from 'textarea-caret'

import * as Expression from '@core/expressionParser/expression'
import { getExpressionIdentifiers } from '@core/expressionParser/helpers/evaluator'
import Dropdown from '@webapp/commonComponents/form/dropdown'

import { useI18n } from '../hooks'
import { mapStateToProps } from './expressionEditorPopupState'

const functionExamples = {
  min: (
    <>
      <tt>max(3,1,2)</tt> = 1
    </>
  ),
  max: (
    <>
      <tt>max(3,2,1,2)</tt> = 1
    </>
  ),
  pow: (
    <>
      <tt>pow(2,4)</tt> = 2<sup>4</sup> = 16
    </>
  ),
}

const nonIdRegex = /[^\w_]/
const getWordStart = el => {
  for (let i = el.selectionStart; i >= 0; i--) {
    if (nonIdRegex.test(el.value[i])) return i + 1
  }

  return 0
}

const getWordEnd = el => el.selectionStart

const setAutocompleteList = (i18n, nodeDefCurrent, variables, setPrefix, el) => {
  // We don't support auto-completion for text selections. Too complicated.
  if (el.selectionStart !== el.selectionEnd) return

  const value = el.value.slice(getWordStart(el), getWordEnd(el))

  const variables2 = variables.filter(
    v => v.value !== nodeDefCurrent.props.name && v.value.toLowerCase().startsWith(value.toLowerCase()),
  )

  // NB: this is not a perfect method to detect the boundaries, but it works most of the time.
  // A better version requires diving into the parser and/or using a library for this.
  const validBefore = !/["'\w_)]\s*$/.test(el.value.slice(0, getWordStart(el)))
  const validAfter = !/^\s*["'\w_(]/.test(el.value.slice(getWordEnd(el)))
  const shouldAutocomplete = validBefore && validAfter && variables2.length === 1
  const autocompleteSuggestion = shouldAutocomplete ? variables2[0].value.slice(value.length) : ''

  const getFunctionDescription = fnName => (
    <div style={{ cursor: 'auto' }}>
      {i18n.t(`nodeDefEdit.functionDescriptions.${fnName}`)}: {functionExamples[fnName]}
    </div>
  )

  const functions = Object.keys(functionExamples)
    .filter(name => name.toLowerCase().startsWith(value.toLowerCase()))
    .map(name => ({ name, description: getFunctionDescription(name) }))

  setPrefix({
    autocompleteSuggestion,
    value: el.value,
    variables: variables2,
    functions: validBefore && validAfter && value ? functions : [],
  })
}

const validateExpression = (nodeDefCurrent, variables, exprString) => {
  try {
    const expr = Expression.fromString(exprString)
    const ids = getExpressionIdentifiers(expr)
    const unknownIds = ids.filter(
      id =>
        !variables
          .filter(v => v.value !== nodeDefCurrent.props.name)
          .map(v => v.value)
          .includes(id),
    )

    if (unknownIds.length > 0)
      return { error: 'identifierError', message: `Unknown variable: ${unknownIds.join(', ')}` }

    const canBeConstant = true // Name the param
    return { ok: Expression.isValid(expr, canBeConstant) }
  } catch (error) {
    return { error: 'syntaxError', message: error.message }
  }
}

const autocompleteCurrentWord = (updateInput, el, completion) => {
  const v = el.value
  el.value = v.slice(0, getWordStart(el)) + completion + v.slice(getWordEnd(el))
  updateInput(el.value)

  // Ensure we can keep typing without clicking:
  el.focus()
}

const AdvancedExpressionEditorPopup = props => {
  const { nodeDefCurrent, variables, setExpressionCanBeApplied, query, queryDraft, updateDraft } = props

  const [caret, setCaretPos] = useState({ top: 0, left: 0, right: 0 })
  const [prefix, setPrefix] = useState({
    value: query || queryDraft || '',
    variables: variables.filter(v => v.value !== nodeDefCurrent.props.name),
    autocompleteSuggestion: '',
    functions: [],
  })
  const [validation, setValidation] = useState({})
  const { top, left } = caret

  const i18n = useI18n()

  const inputRef = useRef()

  const updateInput = value => {
    const newValidation = value.trim() === '' ? {} : validateExpression(nodeDefCurrent, variables, value)
    setValidation(newValidation)
    setExpressionCanBeApplied(query !== value && !newValidation.error)
    if (!newValidation.error) updateDraft(inputRef.current.value.trim())
  }

  return (
    <div>
      <div className="expression-editor-popup__expr-container" style={{ fontSize: '1rem' }}>
        <textarea
          ref={inputRef}
          defaultValue={query}
          style={{
            backgroundColor: 'white',
            minHeight: `${1 + prefix.value.split(/\n/g).length}em`,
            width: '100%',
          }}
          spellCheck={false}
          onKeyDown={e => {
            if (e.key === 'Tab') e.preventDefault() // Always prevent tabbing out

            if (e.key === 'Tab' || e.key === 'Enter') {
              if (prefix.autocompleteSuggestion) {
                autocompleteCurrentWord(updateInput, e.target, prefix.variables[0].value)
                e.preventDefault() // Allow enter to work in non-completion contexts
              }
            }
          }}
          onKeyUp={e => {
            setCaretPos(getCaretCoordinates(e.target, e.target.selectionStart))
            updateInput(e.target.value)
            setAutocompleteList(i18n, nodeDefCurrent, variables, setPrefix, e.target)
          }}
        />
        <span
          hidden={!prefix.autocompleteSuggestion}
          style={{
            position: 'absolute',
            color: 'grey',
            textDecorationStyle: 'dashed',
            top: top - 2, // A mysterious discrepancy
            left,
          }}
        >
          {prefix.autocompleteSuggestion}
          {prefix.variables.length > 0 &&
            prefix.variables[0].label &&
            prefix.variables[0].label !== prefix.variables[0].value && (
              <div style={{ backgroundColor: 'white', borderColor: 'grey' }}>
                <br />
                {prefix.variables[0].label}
              </div>
            )}
        </span>
      </div>

      <div className="expression-editor-popup__autocompletions">
        <table hidden={prefix.functions.length === 0}>
          <thead>
            <tr>
              <th>{i18n.t('nodeDefEdit.function')}</th>
              <th>{i18n.t('common.description')}</th>
            </tr>
          </thead>
          <tbody>
            {prefix.functions.map((x, i) => (
              <tr
                key={i}
                onClick={() => autocompleteCurrentWord(updateInput, inputRef.current, x.name)}
                cursor={'pointer'}
              >
                <td>{x.name}</td>
                <td>{x.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table hidden={prefix.variables.length < 2}>
          <thead>
            <tr>
              <th>{i18n.t('nodeDefEdit.variable')}</th>
              <th>{i18n.t('common.description')}</th>
            </tr>
          </thead>
          <tbody>
            {prefix.variables.slice(0, 5).map((x, i) => (
              <tr
                key={i}
                onClick={() => autocompleteCurrentWord(updateInput, inputRef.current, x.value)}
                cursor={'pointer'}
              >
                <td>
                  <tt>{x.value}</tt>
                </td>
                <td>{x.label || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dropdown
        className="expression-editor__variables-search"
        items={variables.filter(v => v.value !== nodeDefCurrent.props.name)}
        itemLabelFunction={x => (x.label ? `${x.label} (${x.value})` : x.value)}
        itemKeyProp="value"
        clearOnSelection={true}
        placeholder={i18n.t('nodeDefEdit.variables')}
        onChange={x => autocompleteCurrentWord(updateInput, inputRef.current, x.value)}
      />

      <br />

      <div className="expression-editor__query-container">
        <div className={`query${!validation.error ? '' : ' invalid'}`}>{validation.message}</div>
      </div>
    </div>
  )
}

AdvancedExpressionEditorPopup.defaultProps = {
  query: '', // String representing the expression
  // NOTE: One of the two above is passed on component creation
  nodeDefUuidContext: '', // Entity
  nodeDefUuidCurrent: null, // Attribute
  isBoolean: true, // True if expression returns a boolean condition

  onClose: _ => {},
  onChange: _ => {},
}

export default connect(mapStateToProps)(AdvancedExpressionEditorPopup)
