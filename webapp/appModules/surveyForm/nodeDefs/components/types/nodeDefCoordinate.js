import React from 'react'
import * as R from 'ramda'

import { FormItem, Input } from '../../../../../commonComponents/form/input'
import createNumberMask from 'text-mask-addons/dist/createNumberMask';

import Dropdown from '../../../../../commonComponents/form/dropdown'

import { nodeDefRenderType } from '../../../../../../common/survey/nodeDefLayout'

import Survey from '../../../../../../common/survey/survey'
import { getNodeDefDefaultValue } from '../../nodeDefSystemProps'

class NodeDefCoordinate extends React.Component {

  constructor(props) {
    super(props)

    this.numberMask = createNumberMask({
      prefix: '',
      includeThousandsSeparator: false,
      allowDecimal: true,
      decimalLimit: 12,
      allowNegative: true,
    })
  }

  handleInputChange (node, field, value) {
    const {nodeDef, updateNode} = this.props

    const newValue = R.assoc(field, value)(node.value)

    updateNode(nodeDef, node, newValue)
  }

  render () {
    const {surveyInfo, nodeDef, nodes, edit, entry, renderType} = this.props

    const node = entry ? nodes[0] : null
    const value = node ? node.value : getNodeDefDefaultValue(nodeDef)

    const surveySrs = Survey.getSRS(surveyInfo)
    const selectedSrs = R.find(R.propEq('code', value.srs), surveySrs)

    const xInput = <Input ref="xInput"
                          mask={this.numberMask}
                          readOnly={edit}
                          value={value.x}
                          onChange={value => this.handleInputChange(node, 'x', value)}/>

    const yInput = <Input ref="yInput"
                          mask={this.numberMask}
                          readOnly={edit}
                          value={value.y}
                          onChange={value => this.handleInputChange(node, 'y', value)}/>

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
    )
  }
}

export default NodeDefCoordinate