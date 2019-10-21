import './nodeDefCoordinate.scss'

import React from 'react'
import * as R from 'ramda'

import { useI18n } from '../../../../../../commonComponents/hooks'

import { FormItem, Input } from '../../../../../../commonComponents/form/input'
import createNumberMask from 'text-mask-addons/dist/createNumberMask'

import Dropdown from '../../../../../../commonComponents/form/dropdown'

import Survey from '../../../../../../../core/survey/survey'
import Node from '../../../../../../../core/record/node'
import NodeDefLayout from '../../../../../../../core/survey/nodeDefLayout'

import * as NodeDefUiProps from '../../nodeDefUIProps'

export interface ICoordinateValue {
  srs: string;
  x: number;
  y: number;
}

export const NodeDefCoordinate = props => {

  const i18n = useI18n()

  const numberMask: (s: string) => string = createNumberMask({
    prefix: '',
    includeThousandsSeparator: false,
    allowDecimal: true,
    decimalLimit: 12,
    allowNegative: true,
  })

  const handleInputChange = (node, field: string, value) => {
    const { nodeDef, updateNode } = props

    const newValue = R.assoc(field, value)(node.value)

    updateNode(nodeDef, node, newValue)
  }

  const { surveyInfo, nodeDef, nodes, edit, entry, renderType, canEditRecord, readOnly } = props

  const entryDisabled: boolean = edit || !canEditRecord || readOnly

  const node = entry ? nodes[0] : null
  const value = Node.getValue(node, NodeDefUiProps.getDefaultValue(nodeDef)) as ICoordinateValue

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

  if (renderType === NodeDefLayout.renderType.tableBody) {
    return <div className="survey-form__node-def-table-cell-coordinate survey-form__node-def-table-cell-composite">
      {xInput}
      {yInput}
      {srsDropdown}
    </div>
  }

  return (
    <div className="survey-form__node-def-coordinate">
      <FormItem label={i18n.t('surveyForm.nodeDefCoordinate.x')}>
        {xInput}
      </FormItem>
      <FormItem label={i18n.t('surveyForm.nodeDefCoordinate.y')}>
        {yInput}
      </FormItem>
      <FormItem label={i18n.t('common.srs')}>
        {srsDropdown}
      </FormItem>
    </div>
  )
}

export default NodeDefCoordinate
