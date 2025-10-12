import React from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'
import * as NodeDef from '@core/survey/nodeDef'

import { Dropdown } from '@webapp/components/form'

import { findVariableByName } from '../expressionVariables'

const getSelectedVariable = ({ variables, node }) => {
  if (!node) return null
  const value = node.type === Expression.types.ThisExpression ? Expression.thisVariable : node.name
  return findVariableByName({ variables, name: value })
}

const defaultVariablesFilterFunction = (variable) => variable.nodeDefType !== NodeDef.nodeDefType.entity

const filterVariablesOrGroups = ({ variables, variablesFilterFn = null }) => {
  const thisVariable = variables.find((variable) => variable.value === Expression.thisVariable)

  const filterVariables = (_vars) =>
    _vars.filter(
      (variable) => !!variable.options || (variablesFilterFn?.(variable) ?? defaultVariablesFilterFunction(variable))
    )

  const filterOptions = (options) => filterVariables(options).filter((variable) => variable.uuid !== thisVariable?.uuid)

  const variablesUpdated = filterVariables(variables)

  return variablesUpdated.reduce((groupsAcc, group) => {
    const groupUpdated = { ...group }
    const prevOptions = group.options
    if (prevOptions) {
      const optionsFiltered = filterOptions(prevOptions)
      groupUpdated.options = optionsFiltered
      if (optionsFiltered.length === 0) {
        return groupsAcc
      }
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
