import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import { Responsive, WidthProvider } from 'react-grid-layout'
import classNames from 'classnames'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import { NodeDefLayoutSizes } from '@core/survey/nodeDefLayoutSizes'
import * as Node from '@core/record/node'

import NodeDefSwitch from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefSwitch'
import { useIsMountedRef } from '@webapp/components/hooks'
import { NodeDefsActions, SurveyState } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'

const ResponsiveGridLayout = WidthProvider(Responsive)

const rowMinHeight = 5 // in "rem" unit

const NodeDefEntityFormGrid = (props) => {
  const {
    canAddNode = false,
    canEditRecord = false,
    childDefs = [],
    edit = false,
    entry = false,
    node = null,
    nodeDef,
    preview = false,
    recordUuid = null,
  } = props

  const dispatch = useDispatch()

  const editContainerRef = useRef(null)
  const entryContainerRef = useRef(null)

  const survey = useSelector(SurveyState.getSurvey)
  const cycle = useSelector(SurveyState.getSurveyCycleKey)

  const canEditDef = useAuthCanEditSurvey()

  const mountedRef = useIsMountedRef({ delay: 200 })

  const surveyInfo = Survey.getSurveyInfo(survey)
  const nodeIId = Node.getIId(node)
  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  // on node def or node change, scroll inner container to top
  useEffect(() => {
    const innerContainer = editContainerRef.current?.elementRef?.current ?? entryContainerRef.current
    if (innerContainer) {
      innerContainer.scrollTop = 0
    }
  }, [nodeDefUuid, nodeIId])

  const onChangeLayout = useCallback(
    (layout) => {
      if (window.innerWidth >= 480 && layout.length > 0) {
        dispatch(
          NodeDefsActions.putNodeDefLayoutProp({ nodeDef, key: NodeDefLayout.keys.layoutChildren, value: layout })
        )
      }
    },
    [dispatch, nodeDef]
  )

  const columns = NodeDefLayout.getColumnsNo(cycle)(nodeDef)
  const nodeDefsInnerPage = useMemo(() => NodeDefLayout.rejectNodeDefsWithPage(cycle)(childDefs), [childDefs, cycle])
  const visibleNodeDefsInnerPage = useMemo(
    () =>
      entry
        ? nodeDefsInnerPage.filter(
            (nodeDefInnerPage) =>
              // hide hidden read-only fields
              !(NodeDef.isReadOnly(nodeDefInnerPage) && NodeDef.isHidden(nodeDefInnerPage)) &&
              // hide not applicable fields marked as 'hidden when not applicable'
              (!NodeDefLayout.isHiddenWhenNotRelevant(cycle)(nodeDefInnerPage) ||
                Node.isChildApplicable(nodeDefInnerPage.uuid)(node))
          )
        : nodeDefsInnerPage,
    [cycle, entry, node, nodeDefsInnerPage]
  )

  const rdgLayoutOriginal = NodeDefLayout.getLayoutChildren(cycle)(nodeDef)
  const rdgLayout = useMemo(
    () =>
      (entry ? Node.getNodeLayoutChildren({ cycle, nodeDef, childDefs })(node) : rdgLayoutOriginal).map((gridItem) => {
        const { i: gridItemNodeDefUuid } = gridItem

        const gridItemNodeDef = gridItemNodeDefUuid ? Survey.getNodeDefByUuid(gridItemNodeDefUuid)(survey) : null
        if (!gridItemNodeDef) return gridItem

        // calculate min and max height at runtime in case we change them in the future
        const minH = NodeDefLayoutSizes.getMinGridItemHeight({ nodeDef: gridItemNodeDef })
        const maxH = NodeDefLayoutSizes.getMaxGridItemHeight({ nodeDef: gridItemNodeDef })
        return { ...gridItem, minH, maxH }
      }),
    [childDefs, cycle, entry, node, nodeDef, rdgLayoutOriginal, survey]
  )

  const styleByNodeDefUuid = useMemo(() => {
    if (!entry) return {}
    let lastColumnEnd = 0
    let lastRowOffset = 0
    let currentRowMaxRowEnd = 0
    return rdgLayout.reduce((acc, layoutItem) => {
      const { h, i, minH = 1, x, y, w } = layoutItem
      const minHeight = `${Math.max(minH, h) * rowMinHeight}rem`

      const newRow = x < lastColumnEnd - 1

      const rowOffset = newRow ? Math.max(currentRowMaxRowEnd - y, 0) : lastRowOffset

      const gridRowStart = y + 1 + rowOffset
      const gridRowEnd = gridRowStart + h - 1
      const gridColumnStart = x + 1
      const gridColumnEnd = gridColumnStart + w

      acc[i] = { gridColumnStart, gridColumnEnd, gridRowStart, gridRowEnd, minHeight }

      currentRowMaxRowEnd = newRow ? gridRowEnd : Math.max(currentRowMaxRowEnd, gridRowEnd)
      lastColumnEnd = gridColumnEnd
      lastRowOffset = rowOffset
      return acc
    }, {})
  }, [entry, rdgLayout])

  const visibleNodeDefsComponents = useMemo(
    () =>
      visibleNodeDefsInnerPage.map((childDef) => {
        const nodeDefUuid = NodeDef.getUuid(childDef)
        const style = styleByNodeDefUuid[nodeDefUuid]
        return (
          <div key={nodeDefUuid} className="grid-item" style={style}>
            <NodeDefSwitch
              edit={edit}
              entry={entry}
              preview={preview}
              recordUuid={recordUuid}
              surveyInfo={surveyInfo}
              surveyCycleKey={cycle}
              nodeDef={childDef}
              parentNode={node}
              canEditDef={canEditDef}
              canEditRecord={canEditRecord}
              canAddNode={canAddNode}
            />
          </div>
        )
      }),
    [
      canAddNode,
      canEditDef,
      canEditRecord,
      cycle,
      edit,
      entry,
      node,
      preview,
      recordUuid,
      styleByNodeDefUuid,
      surveyInfo,
      visibleNodeDefsInnerPage,
    ]
  )

  if (nodeDefsInnerPage.length === 0) return null

  if (edit) {
    return (
      <ResponsiveGridLayout
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        autoSize={entry}
        rowHeight={70}
        cols={{ lg: columns, md: columns, sm: columns, xs: columns, xxs: 1 }}
        layouts={{ lg: rdgLayout, md: rdgLayout, sm: rdgLayout, xs: rdgLayout }}
        containerPadding={canEditDef ? [15, 40] : [15, 15]}
        margin={[5, 5]}
        isDraggable={canEditDef}
        isResizable={canEditDef}
        compactType={null}
        preventCollision
        className={classNames('survey-form__node-def-entity-form-grid', { mounted: !!mountedRef.current })}
        onDragStop={onChangeLayout}
        onResizeStop={onChangeLayout}
        ref={editContainerRef}
        useCSSTransforms={false}
      >
        {visibleNodeDefsComponents}
      </ResponsiveGridLayout>
    )
  }

  return (
    <div
      className="survey-form__node-def-entity-form-grid-entry"
      ref={entryContainerRef}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {visibleNodeDefsComponents}
    </div>
  )
}

NodeDefEntityFormGrid.propTypes = {
  nodeDef: PropTypes.any.isRequired,
  childDefs: PropTypes.array,
  recordUuid: PropTypes.string,

  node: PropTypes.object,
  edit: PropTypes.bool,
  entry: PropTypes.bool,
  preview: PropTypes.bool,
  canEditRecord: PropTypes.bool,
  canAddNode: PropTypes.bool,
}

export default NodeDefEntityFormGrid
