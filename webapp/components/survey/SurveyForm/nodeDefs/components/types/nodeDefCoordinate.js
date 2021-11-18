import './nodeDefCoordinate.scss'

import React, { useCallback, useState } from 'react'

import * as A from '@core/arena'
import * as StringUtils from '@core/stringUtils'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Srs from '@core/geo/srs'

import { useI18n } from '@webapp/store/system'

import { Button, Map, PanelRight } from '@webapp/components'
import { FormItem, Input } from '@webapp/components/form/Input'
import { NumberFormats } from '@webapp/components/form/Input'
import { TestId } from '@webapp/utils/testId'

import Dropdown from '@webapp/components/form/Dropdown'

import * as NodeDefUiProps from '../../nodeDefUIProps'

const NodeDefCoordinate = (props) => {
  const i18n = useI18n()

  const [showMap, setShowMap] = useState(false)

  const numberFormat = NumberFormats.decimal({ decimalScale: 12 })

  const { surveyInfo, nodeDef, nodes, edit, entry, renderType, canEditRecord, readOnly } = props

  const entryDisabled = edit || !canEditRecord || readOnly

  const node = entry ? nodes[0] : null
  const value = Node.getValue(node, NodeDefUiProps.getDefaultValue(nodeDef))

  const surveySrs = Survey.getSRS(surveyInfo)
  const singleSrs = surveySrs.length === 1
  const selectedSrs = singleSrs ? surveySrs[0] : surveySrs.find((srs) => srs.code === value.srs)

  const handleInputChange = (field, value) => {
    const { nodeDef, updateNode } = props

    let newValue = A.assoc(field, value)(node.value)

    if (StringUtils.isBlank(newValue.x) && StringUtils.isBlank(newValue.y) && (singleSrs || newValue.srs === null)) {
      newValue = null
    } else if (singleSrs) {
      newValue[Node.valuePropsCoordinate.srs] = selectedSrs.code
    }

    updateNode(nodeDef, node, newValue)
  }

  const toggleShowMap = useCallback(() => setShowMap(!showMap), [showMap, setShowMap])

  const xInput = (
    <Input
      id={TestId.surveyForm.coordinateX(NodeDef.getName(nodeDef))}
      numberFormat={numberFormat}
      readOnly={entryDisabled}
      value={value.x}
      onChange={(value) => handleInputChange(Node.valuePropsCoordinate.x, value)}
    />
  )

  const yInput = (
    <Input
      id={TestId.surveyForm.coordinateY(NodeDef.getName(nodeDef))}
      numberFormat={numberFormat}
      readOnly={entryDisabled}
      value={value.y}
      onChange={(value) => handleInputChange(Node.valuePropsCoordinate.y, value)}
    />
  )

  const srsDropdown = (
    <Dropdown
      idInput={TestId.surveyForm.coordinateSRS(NodeDef.getName(nodeDef))}
      readOnly={entryDisabled}
      items={surveySrs}
      itemKey="code"
      itemLabel={Srs.getNameAndCode}
      selection={selectedSrs}
      onChange={(selection) => handleInputChange(Node.valuePropsCoordinate.srs, selection?.code)}
      disabled={singleSrs}
    />
  )

  const mapPanelRight = showMap ? (
    <PanelRight width="40vw" onClose={toggleShowMap}>
      <Map markerPosition={value} />{' '}
    </PanelRight>
  ) : null

  const mapTriggerButton = <Button label="Map" onClick={toggleShowMap} />

  if (renderType === NodeDefLayout.renderType.tableBody) {
    return (
      <div className="survey-form__node-def-table-cell-coordinate survey-form__node-def-table-cell-composite">
        {xInput}
        {yInput}
        {srsDropdown}
        {mapTriggerButton}
        {mapPanelRight}
      </div>
    )
  }

  return (
    <div className="survey-form__node-def-coordinate">
      <FormItem label={i18n.t('surveyForm.nodeDefCoordinate.x')}>{xInput}</FormItem>
      <FormItem label={i18n.t('surveyForm.nodeDefCoordinate.y')}>{yInput}</FormItem>
      <FormItem label={i18n.t('common.srs')}>{srsDropdown}</FormItem>
      {mapTriggerButton}
      {mapPanelRight}
    </div>
  )
}

export default NodeDefCoordinate
