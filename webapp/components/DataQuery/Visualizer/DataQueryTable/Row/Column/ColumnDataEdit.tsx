import classNames from 'classnames'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as RecordValidation from '@core/record/recordValidation'

import { useSurveyCycleKey, useSurveyInfo } from '@webapp/store/survey'
import { useAuthCanEditRecord } from '@webapp/store/user'
import { RecordActions, useRecordNode } from '@webapp/store/ui/record'

import ErrorBadge from '@webapp/components/ErrorBadge'
import NodeDefTableCellBody from '@webapp/components/survey/SurveyForm/nodeDefs/components/NodeDefTableCellBody'

import { useColumn } from './store'
import { useAppDispatch } from '@webapp/store'
import type { ArenaAnyNodeDef, ArenaRecordNode } from '@openforis/arena-core'
import { Query } from '@common/model/query'

type ColumnDataEditProps = {
  colWidth: number
  nodeDef: ArenaAnyNodeDef
  query: Query.QueryItem
  row: Record<string, any>
}

const ColumnDataEdit = (props: ColumnDataEditProps) => {
  const { colWidth, nodeDef, query, row } = props
  const { record, cols } = row
  const cell = cols?.[NodeDef.getUuid(nodeDef)]

  const dispatch = useAppDispatch()
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
            parentNode={
              {
                [Node.keys.recordUuid]: Record.getUuid(record),
                [Node.keys.parentUuid]: cell.parentUuid,
              } as ArenaRecordNode
            }
            nodes={[node]}
            entry
            entryDataQuery
            edit={false}
            renderType={NodeDefLayout.renderType.tableBody}
            canEditRecord={canEditRecord}
            updateNode={(...args: Parameters<typeof RecordActions.updateNode>) =>
              dispatch(RecordActions.updateNode(...args))
            }
            removeNode={(...args: Parameters<typeof RecordActions.removeNode>) =>
              dispatch(RecordActions.removeNode(...args))
            }
            createNodePlaceholder={(...args: Parameters<typeof RecordActions.createNodePlaceholder>) =>
              dispatch(RecordActions.createNodePlaceholder(...args))
            }
            windowed={false}
          />
        </ErrorBadge>
      )}
    </div>
  )
}

export default ColumnDataEdit
