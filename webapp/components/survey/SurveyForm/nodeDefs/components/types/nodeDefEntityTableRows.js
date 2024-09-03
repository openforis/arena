import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Node from '@core/record/node'
import { debounce } from '@core/functionsDefer'

import { elementOffset } from '@webapp/utils/domUtils'
import { SurveyState } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import NodeDefEntityTableRow from './nodeDefEntityTableRow'

const NodeDefEntityTableRows = (props) => {
  const {
    canEditDef = false,
    canEditRecord = false,
    entry = false,
    edit = false,
    nodeDef,
    nodes = [],
    parentNode = null,
    preview = false,
    recordUuid = null,
    surveyCycleKey,
    surveyInfo,
  } = props

  const survey = useSelector(SurveyState.getSurvey)
  const nodeDefColumnUuids = NodeDefLayout.getLayoutChildren(surveyCycleKey)(nodeDef)
  const nodeDefValidations = NodeDef.getValidations(nodeDef)
  const minCount = NodeDefValidations.getMinCount(nodeDefValidations)
  const canDeleteRows = !NodeDef.isEnumerate(nodeDef) && (!minCount || nodes.length > minCount)

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

  const tableRowsHeaderRef = useRef(null)
  const tableDataRowsRef = useRef(null)

  const [gridSize, setGridSize] = useState({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
  })

  const onScrollTableDataRows = () => {
    const headerEl = tableRowsHeaderRef.current
    const rowsEl = tableDataRowsRef.current

    const onScroll = () => {
      const { scrollLeft, scrollTop } = rowsEl
      if (scrollLeft !== gridSize.left || scrollTop !== gridSize.top) {
        setGridSize((gridSizePrev) => ({
          ...gridSizePrev,
          left: scrollLeft,
          top: scrollTop,
        }))
      }
    }

    debounce(onScroll, 'scroll-table-data-rows', 100)()

    if (!headerEl || !rowsEl) return

    // adjust header row position
    headerEl.style.left = `${-rowsEl.scrollLeft}px`
  }

  // NodeDef update effect entry mode
  if (!edit) {
    useEffect(() => {
      // Reset scrolls and set grid size
      const tableDataRowsRefEl = tableDataRowsRef.current
      tableDataRowsRefEl.scrollLeft = 0
      tableDataRowsRefEl.scrollTop = 0

      const updateGridSize = () => {
        const { height, width } = elementOffset(tableDataRowsRef.current)

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

  const createRow = ({ renderType, node = null, key = undefined, canDelete = true, index = undefined, ref = null }) => {
    const nodeDefName = NodeDef.getName(nodeDef)
    return (
      <NodeDefEntityTableRow
        id={
          renderType === NodeDefLayout.renderType.tableHeader
            ? TestId.surveyForm.entityRowHeader(nodeDefName)
            : TestId.surveyForm.entityRowData(nodeDefName, index)
        }
        key={key}
        ref={ref}
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
        siblingEntities={nodes}
        surveyCycleKey={surveyCycleKey}
        surveyInfo={surveyInfo}
      />
    )
  }

  return (
    <div className={classNames('survey-form__node-def-entity-table-rows', { edit })}>
      {(edit || !R.isEmpty(nodes)) &&
        createRow({ renderType: NodeDefLayout.renderType.tableHeader, ref: tableRowsHeaderRef })}

      {entry && (
        <div
          className="survey-form__node-def-entity-table-data-rows-wrapper"
          ref={tableDataRowsRef}
          onScroll={onScrollTableDataRows}
        >
          <div className="survey-form__node-def-entity-table-data-rows">
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

export default NodeDefEntityTableRows
