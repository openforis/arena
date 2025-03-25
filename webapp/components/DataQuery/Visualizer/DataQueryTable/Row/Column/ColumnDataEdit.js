import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import classNames from 'classnames'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as RecordValidation from '@core/record/recordValidation'

import { useSurveyCycleKey, useSurveyInfo } from '@webapp/store/survey'
import { useAuthCanEditRecord } from '@webapp/store/user'
import { RecordActions, useRecordNode } from '@webapp/store/ui/record'

import ErrorBadge from '@webapp/components/errorBadge'
import NodeDefTableCellBody from '@webapp/components/survey/SurveyForm/nodeDefs/components/nodeDefTableCellBody'

import { useColumn } from './store'

const ColumnDataEdit = (props) => {
  const { colWidth, nodeDef, query, row } = props
  const { record, cols } = row
  const cell = cols?.[NodeDef.getUuid(nodeDef)]

  const dispatch = useDispatch()
  const surveyInfo = useSurveyInfo()
  const surveyCycleKey = useSurveyCycleKey()
  const canEditRecord = useAuthCanEditRecord(record)
  const { widthOuter } = useColumn({ nodeDef, query, colWidth })

  const cellNode = cell?.node
  const nodeUpdated = useRecordNode({ nodeUuid: cellNode?.uuid })
  const node = nodeUpdated || cellNode
  const recordValidation = Record.getValidation(record)
  const validation = RecordValidation.getNodeValidation(node)(recordValidation)

  return (
    <div
      className={classNames('table__cell', { readonly: NodeDef.isReadOnlyOrAnalysis(nodeDef) })}
      style={{ width: widthOuter }}
    >
      {cell && (
        <ErrorBadge validation={validation} showIcon={false} showLabel={false}>
          <NodeDefTableCellBody
            surveyInfo={surveyInfo}
            surveyCycleKey={surveyCycleKey}
            nodeDef={nodeDef}
            parentNode={{
              [Node.keys.recordUuid]: Record.getUuid(record),
              [Node.keys.parentUuid]: cell.parentUuid,
            }}
            nodes={[node]}
            entry
            entryDataQuery
            edit={false}
            renderType={NodeDefLayout.renderType.tableBody}
            canEditRecord={canEditRecord}
            updateNode={(...args) => dispatch(RecordActions.updateNode(...args))}
            removeNode={(...args) => dispatch(RecordActions.removeNode(...args))}
            createNodePlaceholder={(...args) => dispatch(RecordActions.createNodePlaceholder(...args))}
            windowed={false}
          />
        </ErrorBadge>
      )}
    </div>
  )
}

ColumnDataEdit.propTypes = {
  colWidth: PropTypes.number.isRequired,
  nodeDef: PropTypes.object.isRequired,
  query: PropTypes.object.isRequired,
  row: PropTypes.object.isRequired,
}

export default ColumnDataEdit
