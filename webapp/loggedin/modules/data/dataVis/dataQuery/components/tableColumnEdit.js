import React from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import { useAuthCanEditRecord, useSurveyCycleKey, useSurveyInfo } from '@webapp/commonComponents/hooks'

import NodeDefTableCellBody from '@webapp/loggedin/surveyViews/surveyForm/nodeDefs/components/nodeDefTableCellBody'

import { createNodePlaceholder, removeNode, updateNode } from '@webapp/loggedin/surveyViews/record/actions'

const TableColumnEdit = (props) => {
  const { nodeDef, record, cell } = props

  if (cell) {
    const { parentUuid, node } = cell

    const surveyInfo = useSurveyInfo()
    const surveyCycleKey = useSurveyCycleKey()
    const canEditRecord = useAuthCanEditRecord(record)
    const dispatch = useDispatch()

    const parentNode = {
      [Node.keys.recordUuid]: Record.getUuid(record),
      [Node.keys.parentUuid]: parentUuid,
    }

    return (
      <NodeDefTableCellBody
        className="test"
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
        readOnly={NodeDef.isReadOnly(nodeDef) || NodeDef.isAnalysis(nodeDef)}
        updateNode={(...args) => dispatch(updateNode(...args))}
        removeNode={(...args) => dispatch(removeNode(...args))}
        createNodePlaceholder={(...args) => dispatch(createNodePlaceholder(...args))}
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
}

TableColumnEdit.defaultProps = {
  cell: null,
}

export default TableColumnEdit
