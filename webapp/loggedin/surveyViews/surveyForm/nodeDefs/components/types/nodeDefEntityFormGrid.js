import React, { useEffect, useState } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'

import NodeDefSwitch from '@webapp/loggedin/surveyViews/surveyForm/nodeDefs/nodeDefSwitch'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

const ResponsiveGridLayout = WidthProvider(Responsive)

const NodeDefEntityFormGrid = props => {
  const {
    surveyInfo, surveyCycleKey, nodeDef, childDefs,
    recordUuid, node,
    edit, entry, preview,
    canEditDef, canEditRecord, canAddNode,
    putNodeDefLayoutProp
  } = props

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      setMounted(true)
    }, 200)
  }, [])

  const onChangeLayout = (layout) => {
    if (window.innerWidth >= 480 && layout.length > 0) {
      putNodeDefLayoutProp(nodeDef, NodeDefLayout.keys.layoutChildren, layout)
    }
  }

  const columns = NodeDefLayout.getColumnsNo(surveyCycleKey)(nodeDef)
  const rdgLayout = JSON.parse(JSON.stringify(NodeDefLayout.getLayoutChildren(surveyCycleKey)(nodeDef)))
  const innerPageChildren = NodeDefLayout.rejectNodeDefsWithPage(surveyCycleKey)(childDefs)

  return innerPageChildren.length > 0
    ? (
      <ResponsiveGridLayout
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        autoSize={false}
        rowHeight={70}
        cols={{ lg: columns, md: columns, sm: columns, xs: columns, xxs: 1 }}
        layouts={{ lg: rdgLayout, md: rdgLayout, sm: rdgLayout, xs: rdgLayout }}
        containerPadding={edit && canEditDef ? [15, 40] : [15, 15]}
        margin={[5, 5]}
        isDraggable={edit && canEditDef}
        isResizable={edit && canEditDef}
        compactType={null}
        useCSSTransforms={true}
        preventCollision={true}
        className={mounted ? 'mounted' : ''}
        onDragStop={onChangeLayout}
        onResizeStop={onChangeLayout}>

        {
          innerPageChildren.map(childDef => (
            <div key={NodeDef.getUuid(childDef)}
                 id={NodeDef.getUuid(childDef)}>
              <NodeDefSwitch
                edit={edit}
                entry={entry}
                preview={preview}
                recordUuid={recordUuid}
                surveyInfo={surveyInfo}
                surveyCycleKey={surveyCycleKey}
                nodeDef={childDef}
                parentNode={node}
                canEditDef={canEditDef}
                canEditRecord={canEditRecord}
                canAddNode={canAddNode}/>
            </div>
          ))
        }

      </ResponsiveGridLayout>
    )
    : null
}

export default NodeDefEntityFormGrid