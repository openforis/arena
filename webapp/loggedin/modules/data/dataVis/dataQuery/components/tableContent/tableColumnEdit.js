import React from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as RecordValidation from '@core/record/recordValidation'
import * as Validation from '@core/validation/validation'

import { useSurveyCycleKey, useSurveyInfo } from '@webapp/store/survey'

import { useAuthCanEditRecord } from '@webapp/components/hooks'
import ErrorBadge from '@webapp/components/errorBadge'
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

    const recordValidation = Record.getValidation(record)
    const validation = RecordValidation.getNodeValidation(node)(recordValidation)

    const cellBody = (
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
        updateNode={(...args) => dispatch(updateNode(...args))}
        removeNode={(...args) => dispatch(removeNode(...args))}
        createNodePlaceholder={(...args) => dispatch(createNodePlaceholder(...args))}
        windowed={false}
      />
    )
    return !Validation.isValid(validation) ? (
      <ErrorBadge validation={validation} showIcon={false} showLabel={false}>
        {cellBody}
      </ErrorBadge>
    ) : (
      cellBody
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
