import CodeMirror from 'codemirror/lib/codemirror'

import * as Survey from '@core/survey/survey'
import * as NodeDefExpressionValidator from '@core/survey/nodeDefExpressionValidator'

import * as ExpressionVariables from './expressionVariables'
import functionExamples from './functionExamples'

const _findCharIndex = ({ value, end, matchingRegEx }) => {
  for (let i = end; i >= 0; i -= 1) {
    if (matchingRegEx.test(value[i])) return i + 1
  }
  return 0
}

const nonIdRegex = /[^\w_]/
const getVariableNameStart = ({ value, end }) => _findCharIndex({ value, end, matchingRegEx: nonIdRegex })

const variablesSeparatorRegex = /[\s\-+*/&|]/
const getVariablePathStart = ({ value, end }) => _findCharIndex({ value, end, matchingRegEx: variablesSeparatorRegex })

const getVariableCompletion = ({ group = null, variable, token }) => {
  const { label, value } = variable

  const textParts = []
  if (group) {
    textParts.push(group.label)
  }
  if (label && label !== value) {
    textParts.push(`${label} (${value})`)
  } else {
    textParts.push(value)
  }
  const text = textParts.join('.')
  const data = { text, value }

  return {
    text,
    value,
    data,
    hint: (cm, _data, completionHint) => {
      const doc = cm.getDoc()
      const from = { line: token.line, ch: token.start }
      const to = { line: token.line, ch: token.end }
      doc.replaceRange(completionHint.value, from, to)
    },
  }
}

const getFunctionCompletion = ({ mode, i18n, fnName, token }) => {
  const description = i18n.t(`nodeDefEdit.functionDescriptions.${fnName}`)
  const exampleUsage = functionExamples[mode][fnName]
  const label = `${i18n.t('nodeDefEdit.function')}: ${fnName}: ${exampleUsage}\n  ${description}`
  const completion = {
    text: label,
    value: fnName,
  }
  completion.data = completion
  completion.hint = (cm, _data, completionHint) => {
    const doc = cm.getDoc()
    const from = { line: token.line, ch: token.start }
    const to = { line: token.line, ch: token.end }
    doc.replaceRange(completionHint.value, from, to)
  }

  return completion
}

const getCompletions = ({ mode, i18n, token, variablesGroupedByParentEntity }) => {
  const completions = []
  const start = token.string.toLowerCase().slice(token.start, token.end)

  const includeVariableIfStartsWith = ({ group = null, variable }) => {
    ;[variable.value, variable.label].some((varName) => {
      if (varName && varName.toLowerCase().startsWith(start)) {
        completions.push(getVariableCompletion({ group, variable, token }))
        // Either node.value or node.label matches - no need for both
        return true
      }
      return false
    })
  }

  variablesGroupedByParentEntity.forEach((group) => {
    // group can be a variable (current node def variable)
    if (group.value) {
      includeVariableIfStartsWith({ variable: group })
    }

    group.options?.forEach((variable) => {
      includeVariableIfStartsWith({ group, variable })
    })
  })

  Object.keys(functionExamples[mode]).forEach((fnName) => {
    if (fnName && fnName.toLowerCase().startsWith(start)) {
      completions.push(getFunctionCompletion({ mode, i18n, fnName, token }))
    }
  })

  return completions
}

/* eslint-disable no-param-reassign */
const _prepareTokenForCompletion = ({ token, cursorPosition, cursorLine }) => {
  token.start = getVariableNameStart({ value: token.string, end: cursorPosition })
  token.line = cursorLine

  if (token.end > cursorPosition) {
    token.end = cursorPosition
    token.string = token.string.slice(0, cursorPosition - token.start)
  }
}

const _extractVariables = ({
  mode,
  i18n,
  survey,
  cycle,
  nodeDefCurrent,
  nodeDefContextPath,
  isContextParent,
  includeAnalysis = false,
}) => {
  const nodeDefContextParent = isContextParent ? Survey.getNodeDefParent(nodeDefCurrent)(survey) : nodeDefCurrent
  let nodeDefContext = nodeDefContextParent

  const { lang } = i18n
  const groupByParent = true

  if (nodeDefContextPath) {
    try {
      nodeDefContext = NodeDefExpressionValidator.findReferencedNodeDefLast({
        survey,
        nodeDef: nodeDefCurrent,
        exprString: nodeDefContextPath,
      })
    } catch (e) {
      // ignore it
    }
    return nodeDefContext
      ? ExpressionVariables.getVariablesChildren({
          survey,
          cycle,
          nodeDefContext,
          nodeDefCurrent,
          mode,
          lang,
          groupByParent,
          includeAnalysis,
        })
      : []
  }
  // get variables from context node and its ancestors
  return ExpressionVariables.getVariables({
    survey,
    cycle,
    nodeDefContext,
    nodeDefCurrent,
    mode,
    lang,
    groupByParent,
    includeAnalysis,
  })
}

export const arenaExpressionHint =
  ({ mode, i18n, survey, cycle, nodeDefCurrent, isContextParent = true, includeAnalysis = false }) =>
  (editor) => {
    const cur = editor.getCursor()
    const token = editor.getTokenAt(cur)

    const { ch: cursorPosition, line: cursorLine } = cur

    const variablePath = token.string.slice(
      getVariablePathStart({ value: token.string, end: cursorPosition }),
      cursorPosition
    )
    _prepareTokenForCompletion({ token, cursorPosition, cursorLine })

    const nodeDefContextPath = variablePath.substring(0, variablePath.lastIndexOf('.'))

    const variablesGroupedByParentEntity = _extractVariables({
      mode,
      i18n,
      survey,
      cycle,
      nodeDefCurrent,
      nodeDefContextPath,
      isContextParent,
      includeAnalysis,
    })

    return {
      list: getCompletions({ mode, i18n, token, variablesGroupedByParentEntity }),
      from: CodeMirror.Pos(token.line, token.start),
      to: CodeMirror.Pos(token.line, token.end),
    }
  }
