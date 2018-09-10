import React from 'react'
import * as R from 'ramda'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import Dropdown from '../../../../commonComponents/form/dropdown'
import NodeDefFormItem from './nodeDefFormItem'

import { nodeDefRenderType } from '../../../../../common/survey/nodeDefLayout'

import { getSurveySrs } from '../../../../../common/survey/survey'
import { toSrsItems } from '../../../../../common/app/srs'
import { getNodeDefDefaultValue } from '../nodeDefSystemProps'

class NodeDefCoordinate extends React.Component {

  handleInputChange (node, field, value) {
    const {nodeDef, parentNode, updateNode} = this.props

    const newValue = R.assoc(field, value)(node.value)

    updateNode(nodeDef, node, newValue)
  }

  render () {
    const {survey, nodeDef, nodes, edit, entry, renderType, label} = this.props

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

    const node = entry ? nodes[0] : null
    const value = node ? node.value : getNodeDefDefaultValue(nodeDef)
    const srsItems = toSrsItems(getSurveySrs(survey))

    if (renderType === nodeDefRenderType.tableBody) {
      return <div className="node-def__coordinate-table-row">
        <Input ref="xInput"
               readOnly={edit}
               value={value.x}
               onChange={(e) => this.handleInputChange(node, 'x', e.target.value)}/>
        <Input ref="yInput"
               readOnly={edit}
               value={value.y}
               onChange={(e) => this.handleInputChange(node, 'y', e.target.value)}/>
        <Dropdown ref="srsDropdown"
                  readOnly={edit}
                  items={srsItems}
                  selection={value.srs}
                  onChange={(selection) => this.handleInputChange(node, 'srs', R.prop('key')(selection))}/>
      </div>
    }

    return (
      <NodeDefFormItem {...this.props}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr'
        }}>
          <FormItem label="X">
            <Input ref="xInput"
                   readOnly={edit}
                   value={value.x}
                   onChange={(e) => this.handleInputChange(node, 'x', e.target.value)}/>
          </FormItem>
          <FormItem label="Y">
            <Input ref="yInput"
                   readOnly={edit}
                   value={value.y}
                   onChange={(e) => this.handleInputChange(node, 'y', e.target.value)}/>
          </FormItem>
          <FormItem label="SRS">
            <Dropdown ref="srsDropdown"
                      readOnly={edit}
                      items={srsItems}
                      selection={value.srs}
                      onChange={(selection) => this.handleInputChange(node, 'srs', R.prop('key')(selection))}/>
          </FormItem>
        </div>
      </NodeDefFormItem>
    )
  }
}

export default NodeDefCoordinate