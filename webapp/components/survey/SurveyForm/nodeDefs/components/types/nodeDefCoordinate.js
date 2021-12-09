import './nodeDefCoordinate.scss'

import React, { useCallback, useState } from 'react'
import classNames from 'classnames'

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
import Dropdown from '@webapp/components/form/Dropdown'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useAuthCanSeeMap } from '@webapp/store/user/hooks'
import { TestId } from '@webapp/utils/testId'

import * as NodeDefUiProps from '../../nodeDefUIProps'

const numberFormat = NumberFormats.decimal({ decimalScale: 12 })

const NodeDefCoordinate = (props) => {
  const { insideTable, surveyInfo, nodeDef, nodes, edit, entry, renderType, canEditRecord, readOnly, updateNode } =
    props

  const i18n = useI18n()
  const lang = useSurveyPreferredLang()
  const canSeeMap = useAuthCanSeeMap()

  const [showMap, setShowMap] = useState(false)

  const entryDisabled = edit || !canEditRecord || readOnly

  const node = entry ? nodes[0] : null
  const value = Node.getValue(node, NodeDefUiProps.getDefaultValue(nodeDef))

  const surveySrs = Survey.getSRS(surveyInfo)
  const singleSrs = surveySrs.length === 1
  const selectedSrs = singleSrs ? surveySrs[0] : surveySrs.find((srs) => srs.code === value.srs)

  const nodeDefLabel = NodeDef.getLabel(nodeDef, lang)

  const handleValueChange = (newValue) => {
    // adjust value:
    // - if x and y are blank, consider store value as null
    // - if single srs, set it into value
    let valueAdjusted = { ...newValue }
    if (StringUtils.isBlank(newValue.x) && StringUtils.isBlank(newValue.y) && (singleSrs || newValue.srs === null)) {
      valueAdjusted = null
    } else if (singleSrs) {
      valueAdjusted[Node.valuePropsCoordinate.srs] = selectedSrs.code
    }
    updateNode(nodeDef, node, valueAdjusted)
  }

  const handleInputChange = (field, value) => {
    if (entryDisabled) {
      return // input change could be triggered by numeric input field formatting
    }
    let fieldValue
    if (StringUtils.isBlank(value)) {
      fieldValue = null
    } else if ([Node.valuePropsCoordinate.x, Node.valuePropsCoordinate.y].includes(field)) {
      fieldValue = Number(value)
    } else {
      fieldValue = value
    }
    handleValueChange({ ...Node.getValue(node), [field]: fieldValue })
  }

  const handleLocationOnMapChanged = useCallback((markerPointUpdated) => {
    handleValueChange(markerPointUpdated)
    setShowMap(false)
  }, [])

  const toggleShowMap = useCallback(() => setShowMap(!showMap), [showMap, setShowMap])

  const xInput = (
    <Input
      id={TestId.surveyForm.coordinateX(NodeDef.getName(nodeDef))}
      numberFormat={numberFormat}
      readOnly={entryDisabled}
      value={StringUtils.nullToEmpty(value.x)}
      onChange={(value) => handleInputChange(Node.valuePropsCoordinate.x, value)}
    />
  )

  const yInput = (
    <Input
      id={TestId.surveyForm.coordinateY(NodeDef.getName(nodeDef))}
      numberFormat={numberFormat}
      readOnly={entryDisabled}
      value={StringUtils.nullToEmpty(value.y)}
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
    <PanelRight className="map-panel" width="40vw" onClose={toggleShowMap} header={nodeDefLabel}>
      <Map
        editable={!entryDisabled}
        markerPoint={value}
        markerTitle={nodeDefLabel}
        onMarkerPointChange={handleLocationOnMapChanged}
      />
    </PanelRight>
  ) : null

  const mapTriggerButton = canSeeMap ? (
    <Button
      className="map-trigger-btn btn-transparent"
      title="surveyForm.nodeDefCoordinate.showOnMap"
      iconClassName={`icon-map ${insideTable ? 'icon-14px' : 'icon-24px'}`}
      onClick={toggleShowMap}
      disabled={edit}
    />
  ) : null

  if (renderType === NodeDefLayout.renderType.tableBody) {
    return (
      <div
        className={classNames(
          'survey-form__node-def-table-cell-composite',
          'survey-form__node-def-table-cell-coordinate',
          { 'with-map': canSeeMap }
        )}
      >
        {xInput}
        {yInput}
        {srsDropdown}
        {mapTriggerButton}
        {mapPanelRight}
      </div>
    )
  }

  return (
    <div className={classNames('survey-form__node-def-coordinate', { 'with-map': canSeeMap })}>
      <FormItem label={i18n.t('surveyForm.nodeDefCoordinate.x')}>{xInput}</FormItem>
      <FormItem label={i18n.t('surveyForm.nodeDefCoordinate.y')}>{yInput}</FormItem>
      <FormItem label={i18n.t('common.srs')}>{srsDropdown}</FormItem>
      {mapTriggerButton}
      {mapPanelRight}
    </div>
  )
}

export default NodeDefCoordinate
