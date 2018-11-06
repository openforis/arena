import React from 'react'
import * as R from 'ramda'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import Dropdown from '../../../../commonComponents/form/dropdown'
import NodeDefFormItem from './nodeDefFormItem'

import { nodeDefRenderType } from '../../../../../common/survey/nodeDefLayout'

import { getSurveySrs } from '../../../../../common/survey/survey'
import { getNodeDefDefaultValue } from '../nodeDefSystemProps'

class NodeDefCoordinate extends React.Component {

  handleInputChange (node, field, value) {
    const {nodeDef, updateNode} = this.props

    const newValue = R.assoc(field, value)(node.value)

    updateNode(nodeDef, node, newValue)
  }

  render () {
    const {surveyInfo, nodeDef, nodes, edit, entry, renderType, label} = this.props

    // table header
    if (renderType === nodeDefRenderType.tableHeader) {
      return <div className="node-def__table-row-coordinate">
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
    const surveySrs = getSurveySrs(surveyInfo)
    const selectedSrs = R.find(R.propEq('code', value.srs), surveySrs)

    const xInput = <Input ref="xInput"
                          readOnly={edit}
                          value={value.x}
                          onChange={(e) => this.handleInputChange(node, 'x', e.target.value)}/>

    const yInput = <Input ref="yInput"
                          readOnly={edit}
                          value={value.y}
                          onChange={(e) => this.handleInputChange(node, 'y', e.target.value)}/>

    const srsDropdown = <Dropdown ref="srsDropdown"
                                  readOnly={edit}
                                  items={surveySrs}
                                  itemKeyProp="code"
                                  itemLabelProp="name"
                                  selection={selectedSrs}
                                  onChange={(selection) => this.handleInputChange(node, 'srs', R.prop('code')(selection))}/>

    if (renderType === nodeDefRenderType.tableBody) {
      return <div className="node-def__table-row-coordinate node-def__table-data-composite-attr">
        {xInput}
        {yInput}
        {srsDropdown}
      </div>
    }

    return (
      <NodeDefFormItem {...this.props}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          rowGap: '.3rem',
        }}>
          <FormItem label="X">
            {xInput}
          </FormItem>
          <FormItem label="Y">
            {yInput}
          </FormItem>
          <FormItem label="SRS">
            {srsDropdown}
          </FormItem>
        </div>
      </NodeDefFormItem>
    )
  }
}

export default NodeDefCoordinate