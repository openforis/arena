import './nodeDefCoordinate.scss'

import React from 'react'
import * as R from 'ramda'

import { useI18n } from '@webapp/store/system'

import { FormItem, Input } from '@webapp/components/form/Input'
import { NumberFormats } from '@webapp/components/form/Input'

import Dropdown from '@webapp/components/form/Dropdown'

import * as Survey from '@core/survey/survey'
import * as Node from '@core/record/node'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import * as NodeDefUiProps from '../../nodeDefUIProps'

const NodeDefCoordinate = (props) => {
  const i18n = useI18n()

  const numberFormat = NumberFormats.decimal({ decimalScale: 12 })

  const handleInputChange = (node, field, value) => {
    const { nodeDef, updateNode } = props

    const newValue = R.assoc(field, value)(node.value)

    updateNode(nodeDef, node, newValue)
  }

  const { surveyInfo, nodeDef, nodes, edit, entry, renderType, canEditRecord, readOnly } = props

  const entryDisabled = edit || !canEditRecord || readOnly

  const node = entry ? nodes[0] : null
  const value = Node.getValue(node, NodeDefUiProps.getDefaultValue(nodeDef))

  const surveySrs = Survey.getSRS(surveyInfo)
  const selectedSrs = R.find(R.propEq('code', value.srs), surveySrs)

  const xInput = (
    <Input
      numberFormat={numberFormat}
      readOnly={entryDisabled}
      value={value.x}
      onChange={(value) => handleInputChange(node, 'x', value)}
    />
  )

  const yInput = (
    <Input
      numberFormat={numberFormat}
      readOnly={entryDisabled}
      value={value.y}
      onChange={(value) => handleInputChange(node, 'y', value)}
    />
  )

  const srsDropdown = (
    <Dropdown
      readOnly={entryDisabled}
      items={surveySrs}
      itemKey="code"
      itemLabel="name"
      selection={selectedSrs}
      onChange={(selection) => handleInputChange(node, 'srs', R.prop('code')(selection))}
    />
  )

  if (renderType === NodeDefLayout.renderType.tableBody) {
    return (
      <div className="survey-form__node-def-table-cell-coordinate survey-form__node-def-table-cell-composite">
        {xInput}
        {yInput}
        {srsDropdown}
      </div>
    )
  }

  return (
    <div className="survey-form__node-def-coordinate">
      <FormItem label={i18n.t('surveyForm.nodeDefCoordinate.x')}>{xInput}</FormItem>
      <FormItem label={i18n.t('surveyForm.nodeDefCoordinate.y')}>{yInput}</FormItem>
      <FormItem label={i18n.t('common.srs')}>{srsDropdown}</FormItem>
    </div>
  )
}

export default NodeDefCoordinate
