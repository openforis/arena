import React from 'react'

import { Responsive, WidthProvider } from 'react-grid-layout'
import { getNoColumns, isRenderForm } from './entityDefLayout'

const ResponsiveGridLayout = WidthProvider(Responsive)

const EntityDefFormComponent = ({entityDef, onLayoutChange}) => {
  const {children = []} = entityDef

  const columns = getNoColumns(entityDef)
  return (
    <ResponsiveGridLayout breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
                          cols={{lg: columns, md: columns, sm: columns, xs: 1, xxs: 1}}
                          rowHeight={60}
                          autoSize={false}
                          onLayoutChange={onLayoutChange}

      // onDragStart={printEvtTargets}
      // onDrag={printEvtTargets}
      //                     onDragStop={printEvtTargets}
      // onResizeStart={printEvtTargets}
      // onResize={printEvtTargets}
      //                     onResizeStop={printEvtTargets}

    >
      {/*{*/}
        {/*children.map((nodeDef, i) =>*/}
          {/*<div key={i} data-grid={nodeDef.layout}>{nodeDef.props.name}</div>*/}
        {/*)*/}
      {/*}*/}
      <div> fadsfgadsfadsfgadsg </div>
    </ResponsiveGridLayout>
  )

}

const EntityDefComponent = ({entityDef}) => {
  console.log('EntityDefComponent')
  console.log(entityDef)

  const {children = []} = entityDef

  const columns = getNoColumns(entityDef)

  const printEvtTargets = (layout, oldItem, newItem, placeholder, e, element) => {

    console.log('evt ', e)
    console.log('layout ', layout)
    console.log('oldItem ', oldItem)
    console.log('newItem ', newItem)
    console.log('placeholder ', placeholder)
    console.log('element ', element)

  }

  const onLayoutChange= (currentLayout, allLayouts) => {
    console.log('currentLayout ', currentLayout)
    console.log('allLayouts ', allLayouts)
  }

  console.log('isRenderForm(entityDef)')
  console.log(isRenderForm(entityDef))

  return (
    isRenderForm(entityDef)
      ? <EntityDefFormComponent entityDef={entityDef} onLayoutChange={onLayoutChange}/>
      //TODO Render table
      : null

  )
}

export default EntityDefComponent