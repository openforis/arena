import React from 'react'
import { connect } from 'react-redux'

import { Responsive, WidthProvider } from 'react-grid-layout'
import AttributeDefComponent from './attributeDefComponent'

import { getNoColumns, isRenderForm } from './entityDefLayout'
import { isNodeDefAttribute } from '../../../../common/survey/nodeDef'

import { getNodeDefChildren } from '../../surveyState'

const ResponsiveGridLayout = WidthProvider(Responsive)

const EntityDefFormComponent = ({nodeDef, children, onLayoutChange}) => {

  const columns = getNoColumns(nodeDef)

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
      {
        children.map((childDef, i) =>
          <div key={i}>
            {
              isNodeDefAttribute(childDef)
                ? <AttributeDefComponent nodeDef={childDef}/>
                //TODO: entity
                : null
            }
          </div>
        )
      }

    </ResponsiveGridLayout>
  )

}

class EntityDefComponent extends React.Component {
  render () {
    const {nodeDef, children} = this.props

    const printEvtTargets = (layout, oldItem, newItem, placeholder, e, element) => {

      console.log('evt ', e)
      console.log('layout ', layout)
      console.log('oldItem ', oldItem)
      console.log('newItem ', newItem)
      console.log('placeholder ', placeholder)
      console.log('element ', element)

    }

    const onLayoutChange = (currentLayout, allLayouts) => {
      console.log('currentLayout ', currentLayout)
      console.log('allLayouts ', allLayouts)
    }

    return (
      isRenderForm(nodeDef)
        ? <EntityDefFormComponent nodeDef={nodeDef} children={children} onLayoutChange={onLayoutChange}/>
        //TODO Render table
        : null

    )
  }
}

const mapStateToProps = (state, props) => ({
  children: getNodeDefChildren(props.nodeDef)(state),
})

export default connect(mapStateToProps)(EntityDefComponent)