import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Node from '@core/record/node'
import { debounce } from '@core/functionsDefer'

import { elementOffset } from '@webapp/utils/domUtils'
import { SurveyState } from '@webapp/store/survey'
import { DataTestId } from '@webapp/utils/dataTestId'

import NodeDefEntityTableRow from './nodeDefEntityTableRow'

const NodeDefEntityTableRows = (props) => {
  const {
    canEditDef,
    canEditRecord,
    edit,
    entry,
    nodeDef,
    nodes,
    parentNode,
    preview,
    recordUuid,
    surveyCycleKey,
    surveyInfo,
  } = props

  const survey = useSelector(SurveyState.getSurvey)
  const nodeDefColumnUuids = NodeDefLayout.getLayoutChildren(surveyCycleKey)(nodeDef)
  const nodeDefValidations = NodeDef.getValidations(nodeDef)
  const minCount = NodeDefValidations.getMinCount(nodeDefValidations)
  const canDeleteRows = !minCount || nodes.length > minCount

  const nodeDefColumns = R.reduce(
    (nodeDefColumnsAgg, nodeDefColumnUuid) => {
      const nodeDefChild = Survey.getNodeDefByUuid(nodeDefColumnUuid)(survey)
      if (nodeDefChild && !NodeDef.isAnalysis(nodeDefChild)) {
        nodeDefColumnsAgg.push(nodeDefChild)
      }
      return nodeDefColumnsAgg
    },
    [],
    nodeDefColumnUuids
  )

  const tableRowsRef = useRef(null)
  const tableDataRowsRef = useRef(null)

  const [gridSize, setGridSize] = useState({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
  })
  const debounceDelayOnScroll = 100

  const onScrollTableRows = () => {
    const onScroll = () => {
      const scrollLeft = tableRowsRef?.current?.scrollLeft || false
      if (scrollLeft !== gridSize.left) {
        setGridSize((gridSizePrev) => ({
          ...gridSizePrev,
          left: scrollLeft,
        }))
      }
    }

    debounce(onScroll, 'scroll-table-rows', debounceDelayOnScroll)()
  }

  const onScrollTableDataRows = () => {
    const onScroll = () => {
      const { scrollTop } = tableDataRowsRef.current
      if (scrollTop !== gridSize.top) {
        setGridSize((gridSizePrev) => ({
          ...gridSizePrev,
          top: scrollTop,
        }))
      }
    }

    debounce(onScroll, 'scroll-table-data-rows', debounceDelayOnScroll)()
  }

  // NodeDef update effect entry mode
  if (!edit) {
    useEffect(() => {
      // Reset scrolls and set grid size
      tableRowsRef.current.scrollLeft = 0
      tableDataRowsRef.current.scrollTop = 0

      const updateGridSize = () => {
        const { width } = elementOffset(tableRowsRef.current)
        const { height } = elementOffset(tableDataRowsRef.current)

        setGridSize((gridSizePrev) => ({
          ...gridSizePrev,
          width,
          height,
        }))
      }

      updateGridSize()

      // Add resize event listener
      const onWindowResize = () => {
        debounce(updateGridSize, 'upgrade-grid-size', 200)()
      }

      window.addEventListener('resize', onWindowResize)

      return () => {
        window.removeEventListener('resize', onWindowResize)
      }
    }, [NodeDef.getUuid(nodeDef)])
  }

  const createRow = ({ renderType, node = null, key = undefined, canDelete = true, index = undefined }) => {
    const nodeDefName = NodeDef.getName(nodeDef)
    return (
      <NodeDefEntityTableRow
        id={
          renderType === NodeDefLayout.renderType.tableHeader
            ? DataTestId.surveyForm.entityRowHeader(nodeDefName)
            : DataTestId.surveyForm.entityRowData(nodeDefName, index)
        }
        key={key}
        canEditDef={canEditDef}
        canEditRecord={canEditRecord}
        canDelete={canDelete}
        edit={edit}
        entry={entry}
        gridSize={gridSize}
        i={index}
        node={node}
        nodeDef={nodeDef}
        nodeDefColumns={nodeDefColumns}
        nodes={null}
        parentNode={parentNode}
        preview={preview}
        recordUuid={recordUuid}
        renderType={renderType}
        surveyCycleKey={surveyCycleKey}
        surveyInfo={surveyInfo}
      />
    )
  }

  return (
    <div className="survey-form__node-def-entity-table-rows" ref={tableRowsRef} onScroll={onScrollTableRows}>
      {(edit || !R.isEmpty(nodes)) && createRow({ renderType: NodeDefLayout.renderType.tableHeader })}

      {entry && (
        <div
          className="survey-form__node-def-entity-table-data-rows"
          ref={tableDataRowsRef}
          onScroll={onScrollTableDataRows}
        >
          {gridSize.height > 0 &&
            gridSize.width > 0 &&
            nodes.map((node, index) =>
              createRow({
                renderType: NodeDefLayout.renderType.tableBody,
                node,
                key: `entity-table-row-${Node.getUuid(node)}`,
                canDelete: canDeleteRows,
                index,
              })
            )}
        </div>
      )}
    </div>
  )
}

NodeDefEntityTableRows.propTypes = {
  canEditDef: PropTypes.bool,
  canEditRecord: PropTypes.bool,
  entry: PropTypes.bool,
  edit: PropTypes.bool,
  nodeDef: PropTypes.any.isRequired,
  nodes: PropTypes.array,
  parentNode: PropTypes.any,
  preview: PropTypes.bool,
  recordUuid: PropTypes.string,
  surveyCycleKey: PropTypes.string.isRequired,
  surveyInfo: PropTypes.any.isRequired,
}

NodeDefEntityTableRows.defaultProps = {
  canEditDef: false,
  canEditRecord: false,
  entry: false,
  edit: false,
  nodes: [],
  parentNode: null,
  preview: false,
  recordUuid: null,
}

export default NodeDefEntityTableRows
