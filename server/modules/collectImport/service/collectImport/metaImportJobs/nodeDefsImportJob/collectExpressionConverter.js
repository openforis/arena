import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpressionValidator from '@core/survey/nodeDefExpressionValidator'

/**
 * Converts a Collect XPath expression into a valid JS expression.
 *
 * @param {object} params - Parameters object.
 * @param {!Survey} [params.survey] - The survey.
 * @param {!NodeDef} [params.nodeDefCurrent] - The current node definition being evaluated.
 * @param {!string} [params.expression] - The expression to convert.
 * @returns {string} - The converted expression or null if the conversion is not possible.
 */
const convert = ({ survey, nodeDefCurrent, expression }) => {
  const itemsToReplace = [
    // operators
    { pattern: '\n', replace: ' ' }, // replace carriage return with space
    { pattern: /(?<!([<>!]))=/, replace: '==' }, // equal operator; do not convert less than, greater than or not equal operators
    { pattern: ' and ', replace: ' && ', ignoreCase: true },
    { pattern: ' or ', replace: ' || ', ignoreCase: true },
    // predefined variables
    { pattern: '\\$this', replace: NodeDef.getName(nodeDefCurrent) },
    // not function
    { pattern: /not\(/, replace: '!(' },
    // parent function
    {
      // repeated pattern. E.g. parent()/parent()/..
      // replace all the parent() invocations with the corresponging ancestor def name
      pattern: /(parent\(\)\s*\/\s*)+/,
      replace: (match) => {
        const parentsCount = match.split('/').length - 1
        let currentParent = Survey.getNodeDefParent(nodeDefCurrent)(survey)
        for (let i = 0; i < parentsCount && currentParent !== null; i += 1) {
          currentParent = Survey.getNodeDefParent(currentParent)(survey)
          if (i === parentsCount - 1) {
            return `${NodeDef.getName(currentParent)}/`
          }
        }
        return match // ancestor node definition not found
      },
    },
    // node property access
    { pattern: '/@', replace: '.' },
    // path separator
    { pattern: '/', replace: '.' },
    // boolean values: true, true(), TRUE or TRUE(), false, false(), FALSE or FALSE()
    {
      pattern: /([\s|=]*)((true|false)(\(\))?)([\s|=]*)/,
      replace: (_match, p1, p2, _p3, _p4, p5) => {
        const parts = []

        // p1: start
        if (p1 !== undefined) parts.push(p1)

        // p2: true or false value
        const replaceValue = String(p2.toLowerCase().startsWith('true'))
        parts.push(replaceValue)

        // p5: end
        if (p5 !== undefined) parts.push(p5)

        return parts.join('')
      },
      ignoreCase: true,
    },
    // object conversion
    { pattern: /boolean\(/, replace: 'Boolean(' },
    { pattern: /number\(/, replace: 'Number(' },
    { pattern: /string\(/, replace: 'String(' },
    // numeric functions
    { pattern: /ceiling\(/, replace: 'Math.ceil(' },
    { pattern: /floor\(/, replace: 'Math.floor(' },
    // custom functions
    // idm namespace
    { pattern: 'idm:array', replace: 'Array.of' },
    { pattern: 'idm:blank', replace: 'isEmpty' },
    { pattern: 'idm:not-blank', replace: '!isEmpty' },
    { pattern: 'idm:currentDate', replace: 'now' },
    { pattern: 'idm:currentTime', replace: 'now' },
    {
      pattern: /idm:index\(\)/,
      replace: `index(${NodeDef.getName(Survey.getNodeDefParent(nodeDefCurrent)(survey))})`,
    },
    {
      pattern: /idm:position\(\)/,
      replace: `index(${NodeDef.getName(Survey.getNodeDefParent(nodeDefCurrent)(survey))}) + 1`,
    },
    {
      pattern: /idm:samplingPointCoordinate\(([^)]+)\)/,
      // change the function name but keep the same arguments.
      // E.g. idm:samplingPointCoordinate(cluster_id, plot_id) becomes categoryItemProp('sampling_point_data', 'location', cluster_id, plot_id)
      replace: (_, fnArs) => `categoryItemProp('${Survey.samplingPointDataCategoryName}', 'location', ${fnArs})`,
    },
    {
      pattern: /idm:samplingPointData\(([^)]+)\)/,
      // change the function name but keep the same arguments.
      // E.g. idm:samplingPointCoordinate(cluster_id, plot_id) becomes categoryItemProp('sampling_point_data', 'propertyName', cluster_id, plot_id)
      replace: (_, fnArs) => `categoryItemProp('${Survey.samplingPointDataCategoryName}', ${fnArs})`,
    },
    {
      pattern: /idm:speciesListData\(([^)]+)\)/,
      // change the function name but keep the same arguments.
      // E.g. idm:speciesListData('trees', 'extra_1', species_code) becomes taxonProp('trees', 'extra_1', species_code)
      replace: (_, fnArs) => `taxonProp(${fnArs})`,
    },
    // geo namespace
    // idm:distance is deprecated in Collect
    { pattern: '(geo|idm):distance', replace: 'distance' },
    // math namespace
    { pattern: /math:PI\(\)/, replace: 'Math.PI' },
    // convert directly some functions from math:fnName to Math.fnName
    ...['abs', 'acos', 'asin', 'atan', 'log', 'log10', 'max', 'min', 'pow', 'random', 'sin', 'sqrt', 'tan'].map(
      (fn) => ({ pattern: `math:${fn}`, replace: `Math.${fn}` })
    ),
  ]

  const converted = itemsToReplace
    .reduce((expressionAcc, item) => {
      const { pattern, ignoreCase, replace } = item
      const flags = ['g']
      if (ignoreCase) flags.push('i')
      return expressionAcc.replace(new RegExp(pattern, flags.join('')), replace)
    }, expression.trim())
    // remove extra spaces
    .replace(/\s+/g, ' ')
    .trim()
    // append new line to consider converted expression as an expression inserted with the "advanced expression editor"
    .concat('\n')

  const validationResult = NodeDefExpressionValidator.validate({
    survey,
    nodeDefCurrent,
    exprString: converted,
    isContextParent: true,
    selfReferenceAllowed: true,
  })

  if (validationResult) {
    console.error('expression', expression)
    console.error('validationResult', validationResult)
    return null
  }
  return converted
}

export const CollectExpressionConverter = {
  convert,
}
