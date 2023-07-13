import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

const NodeDefIconKey = (props) => {
  const { nodeDef } = props

  return NodeDef.isKey(nodeDef) && <span className="icon icon-key2 icon-10px node-def__icon-key" />
}

NodeDefIconKey.propTypes = {
  nodeDef: PropTypes.object.isRequired,
}

export default NodeDefIconKey
