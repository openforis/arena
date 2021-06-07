import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'

import Select from '@webapp/components/form/Select'

const findVariableByValue = ({ variables, value }) => variables.find((variable) => variable.value === value)

const findValue = ({ variables, node }) => {
  const value = findVariableByValue({ variables, value: node.name })
  if (!A.isEmpty(value)) return value

  const options = variables.reduce((optionsAggregator, group) => [...optionsAggregator, ...(group.options || [])], [])
  return findVariableByValue({ variables: options, value: node.name })
}

const excludeEntityVariables = (variables) => variables.filter((variable) => !variable.entity)

const filterVariablesOrGroups = ({ variables }) => {
  const variablesUpdated = excludeEntityVariables(variables)

  return variablesUpdated.reduce((groupsAcc, group) => {
    const groupUpdated = { ...group }
    if (group.options) {
      groupUpdated.options = excludeEntityVariables(group.options)
    }
    return [...groupsAcc, groupUpdated]
  }, [])
}

const Identifier = ({ node, variables, onChange }) => {
  // exclude entities from basic expression editor identifiers
  const variablesFiltered = filterVariablesOrGroups({ variables })

  return (
    <Select
      className="identifier"
      options={variablesFiltered}
      value={findValue({ variables: variablesFiltered, node })}
      onChange={(item) => {
        const name = item.value || ''
        const expressionNodeUpdated = { ...node, name }
        onChange(expressionNodeUpdated)
      }}
    />
  )
}

Identifier.propTypes = {
  // Common props
  node: PropTypes.any.isRequired,
  onChange: PropTypes.func.isRequired,
  // Identifier / Member / Call
  variables: PropTypes.array,
}

Identifier.defaultProps = {
  variables: null,
}

export default Identifier
