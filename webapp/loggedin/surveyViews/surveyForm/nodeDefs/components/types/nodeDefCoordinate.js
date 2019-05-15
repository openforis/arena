import React, { useContext } from 'react'
import * as R from 'ramda'

import AppContext from '../../../../../../app/appContext'

import { FormItem, Input } from '../../../../../../commonComponents/form/input'
import createNumberMask from 'text-mask-addons/dist/createNumberMask';

import Dropdown from '../../../../../../commonComponents/form/dropdown'

import { nodeDefRenderType } from '../../../../../../../common/survey/nodeDefLayout'

import Survey from '../../../../../../../common/survey/survey'
import Node from '../../../../../../../common/record/node'

import { getNodeDefDefaultValue } from '../../nodeDefSystemProps'

const NodeDefCoordinate = props => {

  const { i18n } = useContext(AppContext)

  const numberMask = createNumberMask({
    prefix: '',
    includeThousandsSeparator: false,
    allowDecimal: true,
    decimalLimit: 12,
    allowNegative: true,
  })

  const handleInputChange = (node, field, value) => {
    const { nodeDef, updateNode } = props

    const newValue = R.assoc(field, value)(node.value)

    updateNode(nodeDef, node, newValue)
  }

  const { surveyInfo, nodeDef, nodes, edit, entry, renderType, canEditRecord, readOnly } = props

  const entryDisabled = edit || !canEditRecord || readOnly

  const node = entry ? nodes[0] : null
  const value = Node.getValue(node, getNodeDefDefaultValue(nodeDef))

  const surveySrs = Survey.getSRS(surveyInfo)
  const selectedSrs = R.find(R.propEq('code', value.srs), surveySrs)

  const xInput = <Input mask={numberMask}
                        readOnly={entryDisabled}
                        value={value.x}
                        onChange={value => handleInputChange(node, 'x', value)}/>

  const yInput = <Input mask={numberMask}
                        readOnly={entryDisabled}
                        value={value.y}
                        onChange={value => handleInputChange(node, 'y', value)}/>

  const srsDropdown = <Dropdown readOnly={entryDisabled}
                                items={surveySrs}
                                itemKeyProp="code"
                                itemLabelProp="name"
                                selection={selectedSrs}
                                onChange={(selection) => handleInputChange(node, 'srs', R.prop('code')(selection))}/>

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
      <FormItem label={i18n.t('surveyForm.nodeDefCoordinatee.x')}>
        {xInput}
      </FormItem>
      <FormItem label={i18n.t('surveyForm.nodeDefCoordinatee.y')}>
        {yInput}
      </FormItem>
      <FormItem label={i18n.t('surveyForm.nodeDefCoordinatee.srs')}>
        {srsDropdown}
      </FormItem>
    </div>
  )
}

export default NodeDefCoordinate