import React from 'react'
import * as R from 'ramda'
import PropTypes from 'prop-types'

import * as A from '@core/arena'

import Select from '@webapp/components/form/Select'

const findValue = ({ variables, node }) => {
  const value = R.find(R.propEq('value', node.name), variables)
  if (!A.isEmpty(value)) return value
  const options = variables.reduce((optionsAggregator, group) => [...optionsAggregator, ...(group.options || [])], [])
  return R.find(R.propEq('value', node.name), options)
}

const Identifier = ({ node, variables, onChange }) => (
  <Select
    className="identifier"
    options={variables}
    itemLabel="label"
    itemKey="value"
    value={findValue({ variables, node })}
    onChange={(item) => onChange(R.assoc('name', R.propOr('', 'value', item), node))}
  />
)

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
