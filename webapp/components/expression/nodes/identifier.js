import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import * as Expression from '@core/expressionParser/expression'
import * as NodeDef from '@core/survey/nodeDef'

import { Dropdown } from '@webapp/components/form'

const findVariableByValue = ({ variables, value }) => variables.find((variable) => variable.value === value)

const getSelectedVariable = ({ variables, node }) => {
  if (!node) return null
  const value = node.type === Expression.types.ThisExpression ? Expression.thisVariable : node.name
  const variable = findVariableByValue({ variables, value })
  if (!A.isEmpty(variable)) return variable

  const options = variables.reduce((optionsAggregator, group) => [...optionsAggregator, ...(group.options || [])], [])
  return findVariableByValue({ variables: options, value: node.name })
}

const defaultVariablesFilterFunction = (variable) => variable.nodeDefType !== NodeDef.nodeDefType.entity

const filterVariablesOrGroups = ({ variables, variablesFilterFn = null }) => {
  const filterVariables = (variables) => variables.filter(variablesFilterFn ?? defaultVariablesFilterFunction)

  const variablesUpdated = filterVariables(variables)

  return variablesUpdated.reduce((groupsAcc, group) => {
    const groupUpdated = { ...group }
    if (group.options) {
      groupUpdated.options = filterVariables(group.options)
    }
    return [...groupsAcc, groupUpdated]
  }, [])
}

const Identifier = ({ disabled, node, onChange, variables = [], variablesFilterFn = null }) => {
  // exclude entities from basic expression editor identifiers
  const variablesFiltered = filterVariablesOrGroups({ variables, variablesFilterFn })

  return (
    <Dropdown
      className="identifier"
      disabled={disabled}
      items={variablesFiltered}
      onChange={(item) => {
        const name = item?.value ?? ''
        const expressionNodeUpdated = { ...node, name }
        onChange(expressionNodeUpdated)
      }}
      selection={getSelectedVariable({ variables: variablesFiltered, node })}
    />
  )
}

Identifier.propTypes = {
  disabled: PropTypes.bool,
  // Common props
  node: PropTypes.any.isRequired,
  onChange: PropTypes.func.isRequired,
  // Identifier / Member / Call
  variables: PropTypes.array,
  variablesFilterFn: PropTypes.func,
}

export default Identifier
