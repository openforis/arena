import '../react-grid-layout.scss'

import React from 'react'
import * as R from 'ramda'

import { Responsive, WidthProvider } from 'react-grid-layout'
import NodeDefSwitch from '../nodeDefSwitch'

const ResponsiveGridLayout = WidthProvider(Responsive)

import { isNodeDefMultiple } from '../../../../../common/survey/nodeDef'

import {
  nodeDefLayoutProps,
  filterInnerPageChildren,
  getLayout,
  getNoColumns,
} from '../../../../../common/survey/nodeDefLayout'

const onLayoutChange = (props, layout) => {
  const {nodeDef, edit, locked, putNodeDefProp} = props

//console.log(window.innerWidth) ||
  edit && !locked && window.innerWidth > 1200 && layout.length > 0
    ? putNodeDefProp(nodeDef, nodeDefLayoutProps.layout, layout)
    : null
}

const EntityForm = props => {
  const {nodeDef, childDefs, edit, locked, node} = props

  const columns = getNoColumns(nodeDef)
  const rdgLayout = getLayout(nodeDef)
  const innerPageChildren = filterInnerPageChildren(childDefs)

  const childProps = R.pipe(
    R.dissoc('node'),
    R.dissoc('childDefs'),
    R.dissoc('nodeDef'),
  )(props)

  return (
    childDefs.length > 0
      ? <ResponsiveGridLayout breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
                              autoSize={false}
                              rowHeight={edit ? 80 : 60}
                              cols={{lg: columns, md: columns, sm: columns, xs: 1, xxs: 1}}
                              containerPadding={edit ? [20, 50] : [20, 20]}
                              layouts={{
                                lg: rdgLayout,
                                md: rdgLayout,
                                sm: rdgLayout,
                              }}
                              onLayoutChange={(layout) => onLayoutChange(props, layout)}
                              isDraggable={edit && !locked}
                              isResizable={edit && !locked}
        //TODO decide if verticalCompact
                              compactType={'vertical'}>

        {
          innerPageChildren
            .map((childDef, i) =>
              <div key={childDef.uuid}>
                <NodeDefSwitch key={i}
                               {...childProps}
                               nodeDef={childDef}
                               parentNode={node}/>
              </div>
            )
        }

      </ResponsiveGridLayout>
      : null
  )
}

class NodeDefEntityForm extends React.Component {

  render () {
    const {
      nodeDef,
      childDefs,

      // form
      edit,

      // data entry
      entry,
      nodes,
    } = this.props

    // edit survey mode
    if (edit)
      return <EntityForm {...this.props} />

    // entry multiple entity
    if (entry && isNodeDefMultiple(nodeDef)) {
      return <div>
        <select>
          <option>a</option>
        </select>

        {
          this.state.node
            ? <EntityForm {...this.props} node={this.state.node}/>
            : null
        }
      </div>
    }

    // entry single entity
    if (entry && !isNodeDefMultiple(nodeDef))
      return <EntityForm {...this.props} node={nodes[0]}/>

    return null
  }
}

export default NodeDefEntityForm