import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import { useAuthCanEditRecord, useSurveyCycleKey, useSurveyInfo } from '@webapp/commonComponents/hooks'

import NodeDefTableCellBody from '@webapp/loggedin/surveyViews/surveyForm/nodeDefs/components/nodeDefTableCellBody'

import {
  createNodePlaceholder as createNodePlaceholderAction,
  removeNode as removeNodeAction,
  updateNode as updateNodeAction,
} from '@webapp/loggedin/surveyViews/record/actions'

const TableColumnEdit = (props) => {
  const { nodeDef, record, cell, updateNode, removeNode, createNodePlaceholder } = props

  const surveyInfo = useSurveyInfo()
  const surveyCycleKey = useSurveyCycleKey()
  const canEditRecord = useAuthCanEditRecord(record)

  if (cell) {
    const { parentUuid, node } = cell

    const parentNode = {
      [Node.keys.recordUuid]: Record.getUuid(record),
      [Node.keys.parentUuid]: parentUuid,
    }

    return (
      <NodeDefTableCellBody
        surveyInfo={surveyInfo}
        surveyCycleKey={surveyCycleKey}
        nodeDef={nodeDef}
        parentNode={parentNode}
        nodes={[node]}
        entry
        entryDataQuery
        edit={false}
        renderType={NodeDefLayout.renderType.tableBody}
        canEditRecord={canEditRecord}
        updateNode={updateNode}
        removeNode={removeNode}
        createNodePlaceholder={createNodePlaceholder}
        readOnly={NodeDef.isReadOnly(nodeDef) || NodeDef.isAnalysis(nodeDef)}
        windowed={false}
      />
    )
  }

  return null
}

TableColumnEdit.propTypes = {
  nodeDef: PropTypes.object.isRequired,
  record: PropTypes.object.isRequired,
  cell: PropTypes.object,
  updateNode: PropTypes.func.isRequired,
  removeNode: PropTypes.func.isRequired,
  createNodePlaceholder: PropTypes.func.isRequired,
}

TableColumnEdit.defaultProps = {
  cell: null,
}

export default connect(null, {
  updateNode: updateNodeAction,
  removeNode: removeNodeAction,
  createNodePlaceholder: createNodePlaceholderAction,
})(TableColumnEdit)
