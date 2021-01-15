import CodeMirror from 'codemirror/lib/codemirror'
import * as Expression from '@core/expressionParser/expression'

const functionExamples = {
  [Expression.modes.json]: {
    min: 'max(3,1) = 1',
    max: 'max(3,1,2) = 3',
    pow: 'pow(2,3) = 2³ = 8',
    ln: 'ln(10) = 2.302…',
    log10: 'log10(100) = 2',
    includes: `includes(multiple_attribute_name, 'value') = true/false`,
  },
  [Expression.modes.sql]: {
    avg: 'avg(variable_name)',
    count: 'count(variable_name)',
    sum: 'sum(variable_name)',
  },
}

const nonIdRegex = /[^\w_]/
const getWordStart = (value, end) => {
  for (let i = end; i >= 0; i -= 1) {
    if (nonIdRegex.test(value[i])) return i + 1
  }

  return 0
}

const getVariableCompletion = ({ group, variable, token }) => {
  const { label, value } = variable

  const text = `${group.label} / ${label && label !== value ? `${label} (${value})` : value}`
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

  variablesGroupedByParentEntity.forEach((group) => {
    group.options.forEach((variable) => {
      ;[variable.value, variable.label].some((varName) => {
        if (varName && varName.toLowerCase().startsWith(start)) {
          completions.push(getVariableCompletion({ group, variable, token }))
          // Either node.value or node.label matches - no need for both
          return true
        }
        return false
      })
    })
  })

  Object.keys(functionExamples[mode]).forEach((fnName) => {
    if (fnName && fnName.toLowerCase().startsWith(start)) {
      completions.push(getFunctionCompletion({ mode, i18n, fnName, token }))
    }
  })

  return completions
}

export const arenaExpressionHint = (mode, i18n, variablesGroupedByParentEntity, editor) => {
  const cur = editor.getCursor()
  const token = editor.getTokenAt(cur)
  token.start = getWordStart(token.string, cur.ch)
  token.line = cur.line

  if (token.end > cur.ch) {
    token.end = cur.ch
    token.string = token.string.slice(0, cur.ch - token.start)
  }

  return {
    list: getCompletions({ mode, i18n, token, variablesGroupedByParentEntity }),
    from: CodeMirror.Pos(token.line, token.start),
    to: CodeMirror.Pos(token.line, token.end),
  }
}
