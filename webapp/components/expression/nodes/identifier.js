import React from 'react'
import * as R from 'ramda'
import PropTypes from 'prop-types'

import Select from '@webapp/components/form/Select'

const Identifier = ({ node, variables, variablesGroupedByParentUuid, onChange }) => {
  return (
    <Select
      options={variablesGroupedByParentUuid}
      itemLabel="label"
      itemKey="value"
      value={R.find(R.propEq('value', node.name), variables)}
      onChange={(item) => onChange(R.assoc('name', R.propOr('', 'value', item), node))}
    />
  )
}

Identifier.propTypes = {
  // Common props
  node: PropTypes.any.isRequired,
  onChange: PropTypes.func.isRequired,
  // Identifier / Member / Call
  variables: PropTypes.array,
  variablesGroupedByParentUuid: PropTypes.array,
}

Identifier.defaultProps = {
  variables: null,
  variablesGroupedByParentUuid: null,
}

export default Identifier
