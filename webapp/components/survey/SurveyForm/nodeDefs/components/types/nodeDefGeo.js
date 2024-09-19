import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import classNames from 'classnames'

import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { RecordState } from '@webapp/store/ui/record'

import { Button, Map, PanelRight } from '@webapp/components'
import { Input } from '@webapp/components/form/Input'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useAuthCanUseMap } from '@webapp/store/user/hooks'

import * as NodeDefUiProps from '../../nodeDefUIProps'

const NodeDefGeo = (props) => {
  const {
    canEditRecord,
    edit,
    entry,
    insideTable = false,
    nodeDef,
    nodes,
    readOnly = false,
    renderType,
    updateNode,
  } = props

  const lang = useSurveyPreferredLang()
  const canUseMap = useAuthCanUseMap()
  const noHeader = useSelector(RecordState.hasNoHeader)
  const canShowMap = canUseMap && !noHeader

  const [showMap, setShowMap] = useState(false)

  const entryDisabled = edit || !canEditRecord || readOnly

  const node = entry ? nodes[0] : null
  const value = Node.getValue(node, NodeDefUiProps.getDefaultValue(nodeDef))
  const valueText = value ? JSON.stringify(value) : ''

  const nodeDefLabel = NodeDef.getLabel(nodeDef, lang)

  const toggleShowMap = useCallback(() => setShowMap(!showMap), [showMap, setShowMap])

  const textInputField = (
    <Input
      disabled={edit || !canEditRecord || readOnly}
      inputType="textarea"
      value={valueText}
      onChange={(value) => updateNode(nodeDef, node, value)}
    />
  )

  const mapPanelRight = showMap ? (
    <PanelRight className="map-panel" width="40vw" onClose={toggleShowMap} header={nodeDefLabel}>
      <Map editable={!entryDisabled} geoJson={Node.getValue(node)} showOptions={false} />
    </PanelRight>
  ) : null

  const mapTriggerButton = canShowMap ? (
    <Button
      className="map-trigger-btn btn-transparent"
      disabled={edit}
      iconClassName={`icon-map ${insideTable ? 'icon-14px' : 'icon-24px'}`}
      onClick={toggleShowMap}
      title="surveyForm.nodeDefCoordinate.showOnMap"
      variant="text"
    />
  ) : null

  if (renderType === NodeDefLayout.renderType.tableBody) {
    const classNameInTable = classNames(
      'survey-form__node-def-table-cell-composite',
      'survey-form__node-def-table-cell-geo',
      {
        'with-map': canShowMap,
      }
    )
    return (
      <div className={classNameInTable}>
        {mapTriggerButton}
        {mapPanelRight}
      </div>
    )
  }

  return (
    <div className={classNames('survey-form__node-def-geo', { 'with-map': canUseMap })}>
      {textInputField}
      {mapTriggerButton}
      {mapPanelRight}
    </div>
  )
}

NodeDefGeo.propTypes = {
  canEditRecord: PropTypes.bool.isRequired,
  edit: PropTypes.bool.isRequired,
  entry: PropTypes.bool.isRequired,
  insideTable: PropTypes.bool,
  nodeDef: PropTypes.object.isRequired,
  nodes: PropTypes.array.isRequired,
  readOnly: PropTypes.bool,
  renderType: PropTypes.string,
  surveyInfo: PropTypes.object.isRequired,
  updateNode: PropTypes.func.isRequired,
}

export default NodeDefGeo
