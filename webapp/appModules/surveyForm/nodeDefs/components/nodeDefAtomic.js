import React from 'react'

import { FormItem } from '../../../../commonComponents/form/input'

import NodeDefMultipleInTable from './nodeDefMultipleInTable'

import { nodeDefRenderType } from '../../../../../common/survey/nodeDefLayout'
import NodeDef from '../../../../../common/survey/nodeDef'

const NodeDefAtomic = props => {
  const {
    nodeDef, nodes,
    edit, label, renderType,
    singleNodeDefComponent, multipleNodeDefComponent,
  } = props

  const SingleNodeDefComponent = singleNodeDefComponent
  const MultipleNodeDefComponent = multipleNodeDefComponent

  // table header
  if (renderType === nodeDefRenderType.tableHeader) {
    return <label className="node-def__table-header">
      {label}
    </label>
  }

  if (edit) {

    // EDIT MODE

    return <FormItem label={label}>
      <SingleNodeDefComponent {...props} />
    </FormItem>

  } else {

    // ENTRY MODE

    if (renderType === nodeDefRenderType.tableBody) {
      if (NodeDef.isNodeDefMultiple(nodeDef)) {
        return <NodeDefMultipleInTable {...props}
                                       multipleNodeDefComponent={multipleNodeDefComponent}/>
      } else {
        return <SingleNodeDefComponent {...props} node={nodes[0]}/>
      }
    } else {
      return (
        <FormItem label={label}>
          <MultipleNodeDefComponent {...props} />
        </FormItem>
      )
    }
  }
}

NodeDefAtomic.defaultProps = {
  singleNodeDefComponent: null, //renders a single attribute
  multipleNodeDefComponent: null, //renders multiple attributes
}

export default NodeDefAtomic