import React from 'react'
import * as R from 'ramda'

import { newNodePlaceholder } from '../../../../../common/record/node'
import { getSurveySrs } from '../../../../../common/survey/survey'
import { toSrsItems } from '../../../../../common/app/srs'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import Dropdown from '../../../../commonComponents/form/dropdown'
import NodeDefFormItem from './nodeDefFormItem'


class NodeDefCoordinate extends React.Component {

  handleInputChange (node, field, value) {
    const {nodeDef, parentNode, updateNode} = this.props

    const newValue = R.assoc(field, value)(node.value)

    updateNode(nodeDef, node, newValue, parentNode)
  }

  render () {
    const {survey, nodeDef, nodes, parentNode, edit, entry} = this.props

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