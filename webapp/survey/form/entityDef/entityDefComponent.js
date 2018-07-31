import React from 'react'

import * as R from 'ramda'

import { Responsive, WidthProvider } from 'react-grid-layout'

const ResponsiveGridLayout = WidthProvider(Responsive)

const EntityDefComponent = ({entityDef}) => {
  // console.log(entityDef)
  const {layout, children = []} = entityDef
  const {columns} = R.prop('pageDef')(layout)
  const layouts = []

  const childNodeDefs = R.filter(
    nodeDef => R.isNil(R.path(['layout', 'pageDef'], nodeDef))
  )(children)

  const printEvtTargets = (layout, oldItem, newItem, placeholder, e, element) => {

    console.log('evt ', e)
    console.log('layout ', layout)
    console.log('oldItem ', oldItem)
    console.log('newItem ', newItem)
    console.log('placeholder ', placeholder)
    console.log('element ', element)

  }

  return (
    <ResponsiveGridLayout breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
                          cols={{lg: columns, md: columns, sm: columns, xs: 1, xxs: 1}}
                          rowHeight={60}
                          autoSize={false}
                          onLayoutChange={(currentLayout, allLayouts) => {
                            console.log('currentLayout ', currentLayout)
                            console.log('allLayouts ', allLayouts)
                          }}

                          // onDragStart={printEvtTargets}
                          // onDrag={printEvtTargets}
                          onDragStop={printEvtTargets}
                          // onResizeStart={printEvtTargets}
                          // onResize={printEvtTargets}
                          onResizeStop={printEvtTargets}

    >
      {
        childNodeDefs.map((nodeDef, i) =>
          <div key={i} data-grid={nodeDef.layout}>{nodeDef.props.name}</div>
        )
      }
    </ResponsiveGridLayout>

  )
}

export default EntityDefComponent