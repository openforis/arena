import * as Survey from '@core/survey/survey'
import * as Expression from '@core/expressionParser/expression'
import * as NodeDefExpressionValidator from '@core/survey/nodeDefExpressionValidator'

import * as ExpressionVariables from './expressionVariables'

const functionExamples = {
  [Expression.modes.json]: {
    [Expression.functionNames.categoryItemProp]:
      `cateoryItemProp('category_name', 'prop_name', 'codeLevel1', 'codeLevel2', ...)`,
    [Expression.functionNames.distance]: 'distance(coordinate_1, coordinate_2)',
    [Expression.functionNames.first]: 'first(multiple_attribute), first(multiple_entity).entity_attribute, ...',
    [Expression.functionNames.includes]: `includes(multiple_attribute_name, 'value') = true/false`,
    [Expression.functionNames.index]: `index(node_name), index(this), index($context), index(parent(this))`,
    [Expression.functionNames.isEmpty]: `isEmpty(attribute_name) = true/false`,
    [Expression.functionNames.last]:
      'last(multiple_entity_name).entity_attribute_name, last(multiple_attribute_name), ...',
    [Expression.functionNames.ln]: 'ln(10) = 2.302…',
    [Expression.functionNames.log10]: 'log10(100) = 2',
    [Expression.functionNames.max]: 'max(3,1,2) = 3',
    [Expression.functionNames.min]: 'min(3,1) = 1',
    [Expression.functionNames.now]: 'now()',
    [Expression.functionNames.parent]: `parent(this), parent($context), parent(node_name)`,
    [Expression.functionNames.pow]: 'pow(2,3) = 2³ = 8',
    [Expression.functionNames.taxonProp]: `taxonProp('taxonomy_name', 'extra_prop', 'taxon_code')`,
    [Expression.functionNames.uuid]: 'uuid()',
  },
  [Expression.modes.sql]: {
    [Expression.functionNames.avg]: 'avg(variable_name)',
    [Expression.functionNames.count]: 'count(variable_name)',
    [Expression.functionNames.sum]: 'sum(variable_name)',
  },
}

const _findCharIndex = ({ value, end, matchingRegEx }) => {
  for (let i = end; i >= 0; i -= 1) {
    if (matchingRegEx.test(value[i])) return i + 1
  }
  return 0
}

const variablesSeparatorRegex = /[\s\-+*/&|]/
const getVariablePathStart = ({ value, end }) => _findCharIndex({ value, end, matchingRegEx: variablesSeparatorRegex })

const getVariableCompletion = ({ group = null, variable }) => {
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

  return {
    label: text,
    apply: value,
    type: 'variable',
    parentUuid: variable.parentUuid ?? variable[0]?.parentUuid,
  }
}

const getFunctionCompletion = ({ mode, i18n, fnName }) => {
  const description = i18n.t(`nodeDefEdit.functionDescriptions.${fnName}`)
  const exampleUsage = functionExamples[mode][fnName]
  // const label = `${i18n.t('nodeDefEdit.function')}: ${fnName}: ${exampleUsage}`
  const completion = {
    label: fnName,
    detail: `e.g. ${exampleUsage}\n${description}`,
    apply: `${fnName}()`,
    type: 'function',
  }
  return completion
}

const getCompletions = ({ mode, i18n, token, variablesGroupedByParentEntity, includeCustomFunctions = true }) => {
  const completions = []
  const tokenText = token.text.toLowerCase()

  const includeVariableIfStartsWith = ({ group = null, variable }) => {
    ;[variable.value, variable.label].some((varName) => {
      if (varName?.toLowerCase().startsWith(tokenText)) {
        completions.push(getVariableCompletion({ group, variable }))
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

  if (includeCustomFunctions) {
    Object.keys(functionExamples[mode]).forEach((fnName) => {
      if (fnName?.toLowerCase().startsWith(tokenText)) {
        completions.push(getFunctionCompletion({ mode, i18n, fnName }))
      }
    })
  }
  return completions
}

const findNodeDefContext = ({ survey, nodeDefCurrent, nodeDefContextPath }) => {
  let nodeDefContext = null
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

  const { lang } = i18n
  const groupByParent = true

  if (!nodeDefContextPath) {
    // get variables from context node and its ancestors
    return ExpressionVariables.getVariables({
      survey,
      cycle,
      nodeDefContext: nodeDefContextParent,
      nodeDefCurrent,
      mode,
      lang,
      groupByParent,
      includeAnalysis,
    })
  }
  const nodeDefContext = findNodeDefContext({ survey, nodeDefCurrent, nodeDefContextPath })
  if (!nodeDefContext) {
    return []
  }
  return ExpressionVariables.getVariablesChildren({
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

export const codemirrorArenaCompletions =
  ({ mode, i18n, survey, cycle, nodeDefCurrent, isContextParent = true, includeAnalysis = false }) =>
  (context) => {
    let matchingTokenBefore = context.matchBefore(/\w*/)

    if (matchingTokenBefore.from == matchingTokenBefore.to && !context.explicit) return null

    const value = context?.state?.doc?.text?.[0]
    const token = { ...matchingTokenBefore, value }
    const cursorPosition = context.pos

    // const { ch: cursorPosition, line: cursorLine } = cur

    const variablePath = value.slice(getVariablePathStart({ value, end: cursorPosition }), cursorPosition)
    // _prepareTokenForCompletion({ token, cursorPosition, cursorLine })

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
    const options = getCompletions({
      mode,
      i18n,
      token,
      variablesGroupedByParentEntity,
      includeCustomFunctions: !nodeDefContextPath,
    })

    return { from: token.from, options }
  }
