import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpressionValidator from '@core/survey/nodeDefExpressionValidator'
import * as StringUtils from '@core/stringUtils'

const convert = ({ survey, nodeDefCurrent, expression }) => {
  if (StringUtils.isBlank(expression)) {
    return null
  }
  const itemsToReplace = [
    // operators
    { pattern: '=', replace: '==' },
    { pattern: ' and ', replace: ' && ', ignoreCase: true },
    { pattern: ' or ', replace: ' || ', ignoreCase: true },
    // boolean values
    // boolean value: true, true(), FALSE or FALSE()
    { pattern: /^\s*true(\(\))?\s*$/, replace: ' true ', ignoreCase: true },
    { pattern: /^\s*true(\(\))?\s+/, replace: ' true ', ignoreCase: true },
    { pattern: /\strue(\(\))?\s*$/, replace: ' true ', ignoreCase: true },
    // boolean value: false, false(), FALSE or FALSE()
    { pattern: /^\s*false(\(\))?\s*$/, replace: ' false ', ignoreCase: true },
    { pattern: /^\s*false(\(\))?\s+/, replace: ' false ', ignoreCase: true },
    { pattern: /\sfalse(\(\))?\s*$/, replace: ' false ', ignoreCase: true },
    // predefined variables
    { pattern: '\\$this', replace: NodeDef.getName(nodeDefCurrent) },
    // custom functions
    { pattern: 'idm:array', replace: 'Array.of' },
    { pattern: 'idm:blank', replace: 'isEmpty' },
    { pattern: 'idm:not-blank', replace: '!isEmpty' },
    { pattern: 'idm:currentDate', replace: 'now' },
    { pattern: 'idm:currentTime', replace: 'now' },
  ]

  let converted = itemsToReplace.reduce(
    (expressionAcc, item) =>
      expressionAcc.replace(new RegExp(item.pattern, `g${item.ignoreCase ? 'i' : ''}`), item.replace),
    expression
  )

  // remove extra spaces
  converted = converted.replace(/\s+/g, ' ').trim()
  if (converted.length === 0) {
    return null
  }

  const validationResult = NodeDefExpressionValidator.validate({
    survey,
    nodeDefCurrent,
    exprString: converted,
    isContextParent: true,
    selfReferenceAllowed: true,
  })
  if (validationResult !== null) {
    throw new Error(`Error converting expression: ${expression} - ${JSON.stringify(validationResult)}`)
  }
  return converted
}

export const CollectExpressionConverter = {
  convert,
}
