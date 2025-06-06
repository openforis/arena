import { useCallback } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDefExpressionValidator from '@core/survey/nodeDefExpressionValidator'

import { useI18n } from '@webapp/store/system'
import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

import * as ExpressionVariables from './expressionVariables'
import functionExamples from './functionExamples'

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

const findNodeDefContext = async ({ survey, nodeDefCurrent, nodeDefContextPath }) => {
  let nodeDefContext = null
  try {
    nodeDefContext = await NodeDefExpressionValidator.findReferencedNodeDefLast({
      survey,
      nodeDef: nodeDefCurrent,
      exprString: nodeDefContextPath,
    })
  } catch (e) {
    // ignore it
  }
  return nodeDefContext
}

const extractVariables = async ({
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
  const nodeDefContext = await findNodeDefContext({ survey, nodeDefCurrent, nodeDefContextPath })
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

export const useAutocompletionSource = ({ mode, nodeDefCurrent, isContextParent = true, includeAnalysis = false }) => {
  const i18n = useI18n()
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()

  return useCallback(
    async (context) => {
      const matchingTokenBefore = context.matchBefore(/\w*/)

      if (matchingTokenBefore.from == matchingTokenBefore.to && !context.explicit) return null

      const value = context.state?.doc?.text?.[0] ?? ''
      const token = { ...matchingTokenBefore, value }
      const cursorPosition = context.pos

      const variablePath = value.slice(getVariablePathStart({ value, end: cursorPosition }), cursorPosition)

      const nodeDefContextPath = variablePath.substring(0, variablePath.lastIndexOf('.'))

      const variablesGroupedByParentEntity = await extractVariables({
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
    },
    [cycle, i18n, includeAnalysis, isContextParent, mode, nodeDefCurrent, survey]
  )
}
