import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpressionValidator from '@core/survey/nodeDefExpressionValidator'
import * as StringUtils from '@core/stringUtils'
import SamplingPointDataImportJob from '../samplingPointDataImportJob'

const convert = ({ survey, nodeDefCurrent, expression }) => {
  if (StringUtils.isBlank(expression)) {
    return null
  }
  const itemsToReplace = [
    // operators
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
    // boolean values
    // boolean value: true, true(), TRUE or TRUE()
    { pattern: /^\s*true(\(\))?\s*$/, replace: ' true ', ignoreCase: true },
    { pattern: /^\s*true(\(\))?\s+/, replace: ' true ', ignoreCase: true },
    { pattern: /\strue(\(\))?\s*$/, replace: ' true ', ignoreCase: true },
    // boolean value: false, false(), FALSE or FALSE()
    { pattern: /^\s*false(\(\))?\s*$/, replace: ' false ', ignoreCase: true },
    { pattern: /^\s*false(\(\))?\s+/, replace: ' false ', ignoreCase: true },
    { pattern: /\sfalse(\(\))?\s*$/, replace: ' false ', ignoreCase: true },
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
      replace: (_, fnArs) => `categoryItemProp('${SamplingPointDataImportJob.categoryName}', 'location', ${fnArs})`,
    },
    {
      pattern: /idm:samplingPointData\(([^)]+)\)/,
      // change the function name but keep the same arguments.
      // E.g. idm:samplingPointCoordinate(cluster_id, plot_id) becomes categoryItemProp('sampling_point_data', 'propertyName', cluster_id, plot_id)
      replace: (_, fnArs) => `categoryItemProp('${SamplingPointDataImportJob.categoryName}', ${fnArs})`,
    },
    // geo namespace
    // idm:distance is deprecated in Collect
    { pattern: '(geo|idm):distance', replace: 'distance' },
    // math namespace
    { pattern: /math:PI\(\)/, replace: 'Math.PI' },
    // convert directly some functions from math:fnName to Math.fnName
    ...[
      'abs',
      'acos',
      'asin',
      'atan',
      'log',
      'log10',
      'max',
      'min',
      'pow',
      'random',
      'sin',
      'sqrt',
      'tan',
    ].map((fn) => ({ pattern: `math:${fn}`, replace: `Math.${fn}` })),
  ]

  let converted = itemsToReplace.reduce(
    (expressionAcc, item) =>
      expressionAcc.replace(new RegExp(item.pattern, `g${item.ignoreCase ? 'i' : ''}`), item.replace),
    expression
  )

  // remove extra spaces
  converted = converted.replace(/\s+/g, ' ').trim()

  const validationResult = NodeDefExpressionValidator.validate({
    survey,
    nodeDefCurrent,
    exprString: converted,
    isContextParent: true,
    selfReferenceAllowed: true,
  })
  if (validationResult !== null) {
    throw new Error(`Error converting expression: ${expression} => ${converted} : ${JSON.stringify(validationResult)}`)
  }
  return converted
}

export const CollectExpressionConverter = {
  convert,
}
