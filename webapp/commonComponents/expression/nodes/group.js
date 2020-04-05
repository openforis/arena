import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import EditButtons from './editButtons'

const Group = (props) => {
  const { node, onChange, level, renderNode } = props
  const { argument } = node

  return (
    <div className="group">
      <h3>(</h3>
      {React.createElement(renderNode, {
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
  node: PropTypes.any.isRequired,
  onChange: PropTypes.func.isRequired,
  renderNode: PropTypes.elementType.isRequired,
  level: PropTypes.number,
}

Group.defaultProps = {
  level: 0,
}

export default Group
