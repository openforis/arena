import React, { useEffect, useRef } from 'react'
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

const NodeDefEntityFormGrid = (props) => {
  const { nodeDef, childDefs, recordUuid, node, edit, entry, preview, canEditRecord, canAddNode } = props

  const dispatch = useDispatch()

  const gridRef = useRef(null)

  const survey = useSelector(SurveyState.getSurvey)
  const cycle = useSelector(SurveyState.getSurveyCycleKey)

  const canEditDef = useAuthCanEditSurvey()

  const mountedRef = useIsMountedRef({ delay: 200 })

  const surveyInfo = Survey.getSurveyInfo(survey)
  const nodeUuid = Node.getUuid(node)

  // on node change, scroll inner container to top
  useEffect(() => {
    const innerContainer = gridRef.current?.elementRef?.current
    if (innerContainer) {
      innerContainer.scrollTop = 0
    }
  }, [nodeUuid])

  const onChangeLayout = (layout) => {
    if (window.innerWidth >= 480 && layout.length > 0) {
      dispatch(NodeDefsActions.putNodeDefLayoutProp({ nodeDef, key: NodeDefLayout.keys.layoutChildren, value: layout }))
    }
  }

  const columns = NodeDefLayout.getColumnsNo(cycle)(nodeDef)
  const nodeDefsInnerPage = NodeDefLayout.rejectNodeDefsWithPage(cycle)(childDefs)
  const visibleNodeDefsInnerPage = entry
    ? nodeDefsInnerPage.filter(
        (nodeDefInnerPage) =>
          // hide hidden read-only fields
          !(NodeDef.isReadOnly(nodeDefInnerPage) && NodeDef.isHidden(nodeDefInnerPage)) &&
          // hide not applicable fields marked as 'hidden when not applicable'
          (!NodeDefLayout.isHiddenWhenNotRelevant(cycle)(nodeDefInnerPage) ||
            Node.isChildApplicable(nodeDefInnerPage.uuid)(node))
      )
    : nodeDefsInnerPage

  const rdgLayoutOriginal = NodeDefLayout.getLayoutChildren(cycle)(nodeDef)
  const rdgLayout = (entry ? Node.getNodeLayoutChildren({ cycle, nodeDef, childDefs })(node) : rdgLayoutOriginal).map(
    (gridItem) => {
      const { i: gridItemNodeDefUuid } = gridItem

      const gridItemNodeDef = gridItemNodeDefUuid ? Survey.getNodeDefByUuid(gridItemNodeDefUuid)(survey) : null
      if (!gridItemNodeDef) return gridItem

      // calculate min and max height at runtime in case we change them in the future
      const minH = NodeDefLayoutSizes.getMinGridItemHeight({ nodeDef: gridItemNodeDef })
      const maxH = NodeDefLayoutSizes.getMaxGridItemHeight({ nodeDef: gridItemNodeDef })
      return { ...gridItem, minH, maxH }
    }
  )

  if (nodeDefsInnerPage.length === 0) return null

  const styleByNodeDefUuid = entry
    ? rdgLayout.reduce((acc, layoutItem) => {
        const { h, i, minH = 1, x, y, w } = layoutItem
        const minHeight = `${Math.max(minH, h) * 5}rem`

        acc[i] = {
          gridColumnStart: x + 1,
          gridColumnEnd: x + 1 + w,
          gridRowStart: y + 1,
          gridRowEnd: y + 1 + h,
          minHeight,
        }
        return acc
      }, {})
    : {}

  const visibleNodeDefsComponents = visibleNodeDefsInnerPage.map((childDef) => {
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
  })

  if (edit) {
    return (
      <ResponsiveGridLayout
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        autoSize={entry}
        rowHeight={70}
        cols={{ lg: columns, md: columns, sm: columns, xs: columns, xxs: 1 }}
        layouts={{ lg: rdgLayout, md: rdgLayout, sm: rdgLayout, xs: rdgLayout }}
        containerPadding={edit && canEditDef ? [15, 40] : [15, 15]}
        margin={[5, 5]}
        isDraggable={edit && canEditDef}
        isResizable={edit && canEditDef}
        compactType={null}
        preventCollision
        className={classNames('survey-form__node-def-entity-form-grid', { mounted: !!mountedRef.current })}
        onDragStop={onChangeLayout}
        onResizeStop={onChangeLayout}
        ref={gridRef}
        useCSSTransforms={false}
      >
        {visibleNodeDefsComponents}
      </ResponsiveGridLayout>
    )
  }

  return (
    <div
      className="survey-form__node-def-entity-form-grid-entry"
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

NodeDefEntityFormGrid.defaultProps = {
  childDefs: [],
  recordUuid: null,
  node: null,
  edit: false,
  entry: false,
  preview: false,
  canEditRecord: false,
  canAddNode: false,
}

export default NodeDefEntityFormGrid
