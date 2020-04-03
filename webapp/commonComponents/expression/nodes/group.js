import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import EditButtons from './editButtons'

const Group = (props) => {
  const { node, onChange, level, expressionNodeRenderer } = props
  const { argument } = node

  return (
    <div className="group">
      <h3>(</h3>
      {React.createElement(expressionNodeRenderer, {
        ...props,
        level: level + 1,
        node: argument,
        onChange: (item) => onChange(R.assoc('argument', item, node)),
      })}
      <div className="footer">
        <h3>)</h3>
        <EditButtons node={node} onChange={onChange} onDelete={() => onChange(argument)} canDelete />
      </div>
    </div>
  )
}

Group.propTypes = {
  node: PropTypes.any,
  onChange: PropTypes.func,
  level: PropTypes.number,
  expressionNodeRenderer: PropTypes.func,
}

Group.defaultProps = {
  node: null,
  onChange: null,
  level: 0,
  expressionNodeRenderer: null,
}

export default Group
