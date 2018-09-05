import React from 'react'
import * as R from 'ramda'

import { newNodePlaceholder } from '../../../../../common/record/node'
import { getSurveySrs } from '../../../../../common/survey/survey'
import { toSrsItems } from '../../../../../common/app/srs'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import Dropdown from '../../../../commonComponents/form/dropdown'
import NodeDefFormItem from './nodeDefFormItem'
import { nodeDefRenderType } from '../../../../../common/survey/nodeDefLayout'

class NodeDefCoordinate extends React.Component {

  handleInputChange (node, field, value) {
    const {nodeDef, parentNode, updateNode} = this.props

    const newValue = R.assoc(field, value)(node.value)

    updateNode(nodeDef, node, newValue, parentNode)
  }

  render () {
    const {survey, nodeDef, nodes, parentNode, edit, entry, renderType, label} = this.props

    // table header
    if (renderType === nodeDefRenderType.tableHeader) {
      return <div className="node-def__coordinate-table-row">
        <label className="node-def__table-header" style={{gridColumn: '1 / span 3'}}>
          {label}
        </label>
        <div className="node-def__table-header">X</div>
        <div className="node-def__table-header">Y</div>
        <div className="node-def__table-header">SRS</div>
      </div>
    }

    const defaultValue = {x: '', y: '', srs: ''}
    const node = edit ?
      {value: defaultValue}
      : entry && !R.isEmpty(nodes)
        ? nodes[0]
        : newNodePlaceholder(nodeDef, parentNode, defaultValue)

    const srsItems = toSrsItems(getSurveySrs(survey))

    return (
      <NodeDefFormItem {...this.props}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr'
        }}>
          <FormItem label="X">
            <Input ref="xInput"
                   readOnly={edit}
                   value={node.value.x}
                   onChange={(e) => this.handleInputChange(node, 'x', e.target.value)}/>
          </FormItem>
          <FormItem label="Y">
            <Input ref="yInput"
                   readOnly={edit}
                   value={node.value.y}
                   onChange={(e) => this.handleInputChange(node, 'y', e.target.value)}/>
          </FormItem>
          <FormItem label="SRS">
            <Dropdown ref="srsDropdown"
                      readOnly={edit}
                      items={srsItems}
                      selection={node.value.srs}
                      onChange={(selection) => this.handleInputChange(node, 'srs', R.prop('key')(selection))}/>
          </FormItem>
        </div>
      </NodeDefFormItem>
    )
  }
}

export default NodeDefCoordinate