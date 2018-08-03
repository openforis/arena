import React from 'react'

import { nodeDefType } from '../../../../common/survey/nodeDef'
import DefaultNodeDefComponent from './defaultNodeDefComponent'

const NodeDefSwitchComponent = ({nodeDef, draft, edit, render}) => {

  switch (nodeDef.type) {
    case nodeDefType.entity:
      return null

    default:
      return React.createElement(DefaultNodeDefComponent, {nodeDef, draft, edit, render})

  }

}

export default NodeDefSwitchComponent