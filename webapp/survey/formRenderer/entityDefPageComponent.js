import React from 'react'

import * as R from 'ramda'

import { Responsive, WidthProvider } from 'react-grid-layout'

const ResponsiveGridLayout = WidthProvider(Responsive)

const EntityDefPageComponent = ({entityDef}) => {
  console.log(entityDef)
  const {layout, children = []} = entityDef
  const {columns} = R.prop('pageDef')(layout)
  const layouts = []

  return (
    <ResponsiveGridLayout breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
                          cols={{lg: columns, md: columns, sm: columns, xs: 1, xxs: 1}}
                          rowHeight={60}
                          autoSize={false}
                          onLayoutChange={(currentLayout, allLayouts) => {
                            console.log('currentLayout ', currentLayout)
                            console.log('allLayouts ', allLayouts)
                          }}>
      {
        children.map(nodeDef =>
          <div key={nodeDef.id} data-grid={nodeDef.layout}>{nodeDef.props.name}</div>
        )
      }
    </ResponsiveGridLayout>

  )
}

export default EntityDefPageComponent