import CodeMirror from 'codemirror/lib/codemirror'

const functionExamples = {
  min: 'max(3,1) = 1',
  max: 'max(3,1,2) = 3',
  pow: 'pow(2,3) = 2³ = 8',
}

const nonIdRegex = /[^\w_]/
const getWordStart = (value, end) => {
  for (let i = end; i >= 0; i--) {
    if (nonIdRegex.test(value[i])) return i + 1
  }

  return 0
}

const getNodeCompletion = (node, token) => {
  const label = node.label ? `${node.label} (${node.value})` : node.value
  const completion = {
    text: label,
    value: node.value,
  }
  completion.data = completion
  completion.hint = (cm, _data, completion) => {
    const doc = cm.getDoc()
    const from = { line: token.line, ch: token.start }
    const to = { line: token.line, ch: token.end }
    doc.replaceRange(completion.value, from, to)
  }

  return completion
}

const getFunctionCompletion = (i18n, fnName, token) => {
  const description = i18n.t(`nodeDefEdit.functionDescriptions.${fnName}`)
  const exampleUsage = functionExamples[fnName]
  const label = `${i18n.t('nodeDefEdit.function')}: ${fnName}: ${exampleUsage}\n  ${description}`
  const completion = {
    text: label,
    value: fnName,
  }
  completion.data = completion
  completion.hint = (cm, _data, completion) => {
    const doc = cm.getDoc()
    const from = { line: token.line, ch: token.start }
    const to = { line: token.line, ch: token.end }
    doc.replaceRange(completion.value, from, to)
  }

  return completion
}

const getCompletions = (i18n, token, variables) => {
  const completions = []
  const start = token.string.toLowerCase().slice(token.start, token.end)
  for (const node of variables) {
    for (const varName of [node.value, node.label]) {
      if (varName && varName.toLowerCase().startsWith(start)) {
        completions.push(getNodeCompletion(node, token))
        break // Either node.value or node.label matches - no need for both
      }
    }
  }

  for (const fnName of Object.keys(functionExamples)) {
    if (fnName && fnName.toLowerCase().startsWith(start)) {
      completions.push(getFunctionCompletion(i18n, fnName, token))
    }
  }

  return completions
}

export const arenaExpressionHint = (i18n, variables, editor, _options) => {
  const cur = editor.getCursor()
  const token = editor.getTokenAt(cur)
  token.start = getWordStart(token.string, cur.ch)
  token.line = cur.line

  if (token.end > cur.ch) {
    token.end = cur.ch
    token.string = token.string.slice(0, cur.ch - token.start)
  }

  return {
    list: getCompletions(i18n, token, variables),
    from: CodeMirror.Pos(token.line, token.start),
    to: CodeMirror.Pos(token.line, token.end),
  }
}
