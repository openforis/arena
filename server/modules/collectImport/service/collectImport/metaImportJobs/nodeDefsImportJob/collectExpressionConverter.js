export const convertExpression = ({ collectExpression }) => {
  let expression = collectExpression

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
    // custom functions
    { pattern: 'idm:isBlank', replace: 'isEmpty' },
    { pattern: 'idm:isNotBlank', replace: '!isEmpty' },
    { pattern: 'idm:currentDate', replace: 'now' },
    { pattern: 'idm:currentTime', replace: 'now' },
  ]

  expression = itemsToReplace.reduce(
    (expressionAcc, item) =>
      expressionAcc.replace(new RegExp(item.pattern, `g${item.ignoreCase ? 'i' : ''}`), item.replace),
    expression
  )

  // remove extra spaces
  expression = expression.replace(/\s+/g, ' ').trim()

  return expression
}
