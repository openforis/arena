import './nodeDefCoordinate.scss'

import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import classNames from 'classnames'

import * as StringUtils from '@core/stringUtils'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { RecordState } from '@webapp/store/ui/record'

import { FormItem, Input } from '@webapp/components/form/Input'
import { NumberFormats } from '@webapp/components/form/Input'
import SrsDropdown from '@webapp/components/survey/SrsDropdown'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useAuthCanUseMap } from '@webapp/store/user/hooks'
import { TestId } from '@webapp/utils/testId'

import * as NodeDefUiProps from '../../nodeDefUIProps'
import { MapTriggerButton } from '../mapTriggerButton'

const numberFormat = NumberFormats.decimal({ decimalScale: 12 })

const NodeDefCoordinate = (props) => {
  const { canEditRecord, edit, entry, nodeDef, nodes, readOnly = false, renderType, surveyInfo, updateNode } = props

  const lang = useSurveyPreferredLang()
  const canUseMap = useAuthCanUseMap()
  const noHeader = useSelector(RecordState.hasNoHeader)
  const canShowMap = canUseMap && !noHeader

  const entryDisabled = edit || !canEditRecord || readOnly

  const node = entry ? nodes[0] : null
  const value = Node.getValue(node, NodeDefUiProps.getDefaultValue(nodeDef))

  const surveySrs = Survey.getSRS(surveyInfo)
  const singleSrs = surveySrs.length === 1
  const selectedSrs = singleSrs ? surveySrs[0] : surveySrs.find((srs) => srs.code === value.srs)
  const selectedSrsCode = selectedSrs?.code

  const nodeDefLabel = NodeDef.getLabel(nodeDef, lang)
  const additionalFields = NodeDef.getCoordinateAdditionalFields(nodeDef)

  const adjustValue = useCallback(
    (newValue) => {
      if (StringUtils.isBlank(newValue.x) && StringUtils.isBlank(newValue.y) && (singleSrs || newValue.srs === null)) {
        // if x and y are blank, consider store value as null
        return null
      } else if (singleSrs) {
        // if single srs, set it into value
        const valueAdjusted = { ...newValue }
        valueAdjusted[Node.valuePropsCoordinate.srs] = selectedSrsCode
        return valueAdjusted
      }
      return newValue
    },
    [selectedSrsCode, singleSrs]
  )

  const handleValueChange = useCallback(
    (newValue) => {
      const valueAdjusted = adjustValue(newValue)
      updateNode(nodeDef, node, valueAdjusted)
    },
    [nodeDef, node, adjustValue, updateNode]
  )

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

  const handleLocationOnMapChanged = useCallback(
    (markerPointUpdated) => {
      handleValueChange(markerPointUpdated)
    },
    [handleValueChange]
  )

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
    <SrsDropdown
      onChange={(selection) => handleInputChange(Node.valuePropsCoordinate.srs, selection?.code)}
      readOnly={entryDisabled}
      selectedSrsCode={selectedSrsCode}
      testId={TestId.surveyForm.coordinateSRS(NodeDef.getName(nodeDef))}
    />
  )

  const additionalInputFields = additionalFields.map((additionalField) => (
    <Input
      key={additionalField}
      numberFormat={numberFormat}
      readOnly={entryDisabled}
      value={StringUtils.nullToEmpty(value[additionalField])}
      onChange={(value) => handleInputChange(additionalField, value)}
    />
  ))

  const mapTriggerButton = canShowMap ? (
    <MapTriggerButton
      disabled={edit}
      header={nodeDefLabel}
      mapMarkerEditable={true}
      mapMarkerPoint={value}
      mapMarkerTitle={nodeDefLabel}
      onMapMarkerPointChange={handleLocationOnMapChanged}
      panelHeader={nodeDefLabel}
      title="surveyForm:nodeDefCoordinate.showOnMap"
    />
  ) : null

  if (renderType === NodeDefLayout.renderType.tableBody) {
    return (
      <div
        className={classNames(
          'survey-form__node-def-table-cell-composite',
          'survey-form__node-def-table-cell-coordinate',
          { 'with-map': canShowMap }
        )}
      >
        {xInput}
        {yInput}
        {srsDropdown}
        {additionalInputFields}
        {mapTriggerButton}
      </div>
    )
  }

  return (
    <div className={classNames('survey-form__node-def-coordinate', { 'with-map': canUseMap })}>
      <div className="form-items">
        <FormItem label="surveyForm:nodeDefCoordinate.x">{xInput}</FormItem>
        <FormItem label="surveyForm:nodeDefCoordinate.y">{yInput}</FormItem>
        <FormItem label="common.srs">{srsDropdown}</FormItem>
        {additionalFields.map((additionalField, index) => (
          <FormItem key={additionalField} label={`surveyForm:nodeDefCoordinate.${additionalField}`}>
            {additionalInputFields[index]}
          </FormItem>
        ))}
      </div>
      {mapTriggerButton}
    </div>
  )
}

NodeDefCoordinate.propTypes = {
  canEditRecord: PropTypes.bool.isRequired,
  edit: PropTypes.bool.isRequired,
  entry: PropTypes.bool.isRequired,
  nodeDef: PropTypes.object.isRequired,
  nodes: PropTypes.array.isRequired,
  readOnly: PropTypes.bool,
  renderType: PropTypes.string,
  surveyInfo: PropTypes.object.isRequired,
  updateNode: PropTypes.func.isRequired,
}

export default NodeDefCoordinate
