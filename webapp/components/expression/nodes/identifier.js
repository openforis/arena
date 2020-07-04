import React from 'react'
import * as R from 'ramda'

import Dropdown from '@webapp/components/form/Dropdown'

const Identifier = ({ node, variables, onChange }) => (
  <Dropdown
    items={variables}
    selection={R.find(R.propEq('value', node.name), variables)}
    itemLabel="label"
    itemKey="value"
    onChange={item => onChange(R.assoc('name', R.propOr('', 'value', item), node))}
  />
)

export default Identifier
