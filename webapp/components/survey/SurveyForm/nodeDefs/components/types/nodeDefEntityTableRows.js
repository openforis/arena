import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Node from '@core/record/node'
import { debounce } from '@core/functionsDefer'

import { elementOffset } from '@webapp/utils/domUtils'
import { SurveyState, useSurveyPreferredLang } from '@webapp/store/survey'
import { RecordState } from '@webapp/store/ui/record'
import { TestId } from '@webapp/utils/testId'

import NodeDefEntityTableRow from './nodeDefEntityTableRow'
import { getNextSortCriteria, sortNodes } from './nodeDefEntityTableRowsSort'

const NodeDefEntityTableRows = (props) => {
  const {
    canEditDef = false,
    canEditRecord = false,
    canDeleteNode,
    entry = false,
    edit = false,
    nodeDef,
    nodes = [],
    parentNode = null,
    preview = false,
    readOnly = false,
    recordUuid = null,
    surveyCycleKey,
    surveyInfo,
  } = props

  const survey = useSelector(SurveyState.getSurvey)
  const nodeDefColumnUuids = NodeDefLayout.getLayoutChildren(surveyCycleKey)(nodeDef)
  const nodeDefUuid = nodeDef?.uuid

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

  const record = useSelector(RecordState.getRecord)
  const lang = useSurveyPreferredLang()

  const [sortCriteria, setSortCriteria] = useState([])

  const handleSortBy = useCallback((field) => {
    setSortCriteria((prevSortCriteria) => getNextSortCriteria({ sortCriteria: prevSortCriteria, field }))
  }, [])

  const sortedNodes = useMemo(
    () =>
      sortCriteria.length === 0
        ? nodes
        : sortNodes({ nodes, sortCriteria, nodeDefColumns, survey, cycle: surveyCycleKey, lang, record }),
    [nodes, sortCriteria, nodeDefColumns, survey, surveyCycleKey, lang, record]
  )

  const tableRowsHeaderRef = useRef(null)
  const tableDataRowsRef = useRef(null)

  const [gridSize, setGridSize] = useState({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
  })

  const [columnHeaderHeight, setColumnHeaderHeight] = useState(null)
  const [headerCellChromeHeight, setHeaderCellChromeHeight] = useState(0)
  const headerRowRendered = edit || !R.isEmpty(nodes)

  useEffect(() => {
    const headerEl = tableRowsHeaderRef.current
    if (!headerRowRendered || !headerEl) return

    const sampleCellItem = headerEl.querySelector('.react-grid-item')
    if (sampleCellItem) {
      const computedStyle = window.getComputedStyle(sampleCellItem)
      const verticalBorderWidth =
        parseFloat(computedStyle.borderTopWidth || '0') + parseFloat(computedStyle.borderBottomWidth || '0')
      setHeaderCellChromeHeight(verticalBorderWidth)
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const measuredHeight = Math.ceil(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height)
      setColumnHeaderHeight((prevHeight) => (prevHeight === measuredHeight ? prevHeight : measuredHeight))
    })
    observer.observe(headerEl)

    return () => observer.disconnect()
  }, [headerRowRendered])

  const resizableCellHeight =
    columnHeaderHeight === null ? null : Math.max(0, columnHeaderHeight - headerCellChromeHeight)

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
  useEffect(() => {
    if (edit) return
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
  }, [edit, nodeDefUuid])

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
        columnHeaderHeight={resizableCellHeight}
        edit={edit}
        entry={entry}
        gridSize={gridSize}
        i={index}
        node={node}
        nodeDef={nodeDef}
        nodeDefColumns={nodeDefColumns}
        nodes={null}
        onSortBy={entry ? handleSortBy : undefined}
        parentNode={parentNode}
        preview={preview}
        readOnly={readOnly}
        recordUuid={recordUuid}
        renderType={renderType}
        siblingEntities={nodes}
        sortCriteria={sortCriteria}
        surveyCycleKey={surveyCycleKey}
        surveyInfo={surveyInfo}
      />
    )
  }

  return (
    <div
      className={classNames('survey-form__node-def-entity-table-rows', { edit })}
      style={columnHeaderHeight ? { '--column-header-height': `${columnHeaderHeight}px` } : undefined}
    >
      {headerRowRendered &&
        // eslint-disable-next-line react-hooks/refs -- pre-existing pattern: tableRowsHeaderRef is only forwarded to NodeDefEntityTableRow's `ref` prop (a forwardRef component), never dereferenced here.
        createRow({
          renderType: NodeDefLayout.renderType.tableHeader,
          ref: tableRowsHeaderRef,
          canDelete: canDeleteNode,
        })}

      {entry && (
        <div
          className="survey-form__node-def-entity-table-data-rows-wrapper"
          ref={tableDataRowsRef}
          onScroll={onScrollTableDataRows}
        >
          <div className="survey-form__node-def-entity-table-data-rows">
            {gridSize.height > 0 &&
              gridSize.width > 0 &&
              sortedNodes.map((node, index) =>
                createRow({
                  renderType: NodeDefLayout.renderType.tableBody,
                  node,
                  key: `entity-table-row-${Node.getUuid(node)}`,
                  canDelete: canDeleteNode,
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
  canDeleteNode: PropTypes.bool,
  entry: PropTypes.bool,
  edit: PropTypes.bool,
  nodeDef: PropTypes.any.isRequired,
  nodes: PropTypes.array,
  parentNode: PropTypes.any,
  preview: PropTypes.bool,
  readOnly: PropTypes.bool,
  recordUuid: PropTypes.string,
  surveyCycleKey: PropTypes.string.isRequired,
  surveyInfo: PropTypes.any.isRequired,
}

export default NodeDefEntityTableRows
