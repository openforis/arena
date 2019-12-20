import React, { useEffect, useRef, useState, useMemo } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as SurveyState from '@webapp/survey/surveyState'

import { elementOffset } from '@webapp/utils/domUtils'
import { debounce } from '@core/functionsDefer'
import NodeDefEntityTableRow from './nodeDefEntityTableRow'

const NodeDefEntityTableRows = props => {
  const { entry, edit, nodeDef, nodeDefColumns, nodes } = props

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
      const { scrollLeft } = tableRowsRef.current
      if (scrollLeft !== gridSize.left) {
        setGridSize(gridSizePrev => ({
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
        setGridSize(gridSizePrev => ({
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

        setGridSize(gridSizePrev => ({
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

  return (
    <div className="survey-form__node-def-entity-table-rows" ref={tableRowsRef} onScroll={onScrollTableRows}>
      {(edit || !R.isEmpty(nodes)) && (
        <NodeDefEntityTableRow
          {...props}
          node={null}
          renderType={NodeDefLayout.renderType.tableHeader}
          gridSize={gridSize}
          nodeDefColumns={nodeDefColumns}
        />
      )}

      {entry && (
        <div
          className="survey-form__node-def-entity-table-data-rows"
          ref={tableDataRowsRef}
          onScroll={onScrollTableDataRows}
        >
          {gridSize.height > 0 &&
            gridSize.width > 0 &&
            nodes.map((node, i) => (
              <NodeDefEntityTableRow
                key={i}
                i={i}
                {...props}
                node={node}
                nodes={null}
                renderType={NodeDefLayout.renderType.tableBody}
                gridSize={gridSize}
                nodeDefColumns={nodeDefColumns}
              />
            ))}
        </div>
      )}
    </div>
  )
}

const mapStateToProps = (state, props) => {
  const { nodeDef } = props

  const survey = SurveyState.getSurvey(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
  const nodeDefColumnUuids = NodeDefLayout.getLayoutChildren(surveyCycleKey)(nodeDef)

  const nodeDefColumns = R.reduce(
    (nodeDefColumnsAgg, nodeDefColumnUuid) => {
      const nodeDefChild = Survey.getNodeDefByUuid(nodeDefColumnUuid)(survey)
      if (nodeDefChild) nodeDefColumnsAgg.push(nodeDefChild)
      return nodeDefColumnsAgg
    },
    [],
    nodeDefColumnUuids,
  )

  return {
    nodeDefColumns,
  }
}

export default connect(mapStateToProps)(NodeDefEntityTableRows)
