import React from 'react'
import * as R from 'ramda'

import Select from '@webapp/components/form/Select'

const Identifier = ({ node, variables, onChange }) => {
  return (
    <Select
      options={variables}
      itemLabel="label"
      itemKey="value"
      value={R.find(R.propEq('value', node.name), variables)}
      onChange={(item) => onChange(R.assoc('name', R.propOr('', 'value', item), node))}
    />
  )
}

export default Identifier

/*
  <Dropdown
    items={variables}
    selection={R.find(R.propEq('value', node.name), variables)}
    itemLabel="label"
    itemKey="value"
    onChange={item => onChange(R.assoc('name', R.propOr('', 'value', item), node))}
  />
  
 */
