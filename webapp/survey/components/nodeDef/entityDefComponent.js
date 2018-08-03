import './react-grid-layout.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import { Responsive, WidthProvider } from 'react-grid-layout'
import AttributeDefComponent from './attributeDefComponent'

import {
  entityDefLayoutProps,
  filterInnerPageChildren,
  getLayout,
  getNoColumns,
} from '../../../../common/survey/entityDefLayout'

import { isNodeDefAttribute } from '../../../../common/survey/nodeDef'
import { getNodeDefChildren, getSurveyState } from '../../surveyState'

import { fetchNodeDefChildren, putNodeDefProp, setFormNodDefEdit } from '../../nodeDefActions'

const ResponsiveGridLayout = WidthProvider(Responsive)

class EntityDefComponent extends React.Component {

  componentDidMount () {
    const {nodeDef, fetchNodeDefChildren, draft} = this.props

    if (nodeDef.id)
      fetchNodeDefChildren(nodeDef.id, draft)
    else
      this.refs.elem.scrollIntoView()
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    const {nodeDef, fetchNodeDefChildren, draft = true} = this.props
    const prevNodeDefId = R.path(['nodeDef', 'id'], prevProps)
    if (nodeDef.id !== prevNodeDefId)
      fetchNodeDefChildren(nodeDef.id, draft)
  }

  hasChildren () {
    const {children} = this.props
    return children.length > 0
  }

  editNodeDef (nodeDef) {
    const {setFormNodDefEdit} = this.props
    setFormNodDefEdit(nodeDef)
  }

  render () {
    const {
      nodeDef,
      children,
      putNodeDefProp,
      edit,
      draft,
    } = this.props
    const columns = getNoColumns(nodeDef)
    const rdgLayout = getLayout(nodeDef)

    return (
      <div ref="elem" style={{display: 'grid'}}>
        {
          this.hasChildren()
            //TODO ? isRenderForm(nodeDef)
            ? <ResponsiveGridLayout breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
                                    cols={{lg: columns, md: columns, sm: columns, xs: 1, xxs: 1}}
                                    rowHeight={60}
                                    autoSize={false}
                                    onLayoutChange={(layout) => putNodeDefProp(nodeDef, entityDefLayoutProps.layout, layout)}
                                    layouts={{
                                      lg: rdgLayout,
                                      md: rdgLayout,
                                      sm: rdgLayout,
                                    }}
                                    isDraggable={edit}
                                    isResizable={edit}>
              {
                filterInnerPageChildren(children)
                  .map((childDef, i) =>
                    <div key={i}>
                      <React.Fragment>
                        {
                          edit
                            ? <div className="node-def__edit-actions">
                              <button className="btn-s btn-of-light-xs"
                                      onClick={() => this.editNodeDef(childDef)}>
                                <span className="icon icon-pencil2 icon-12px"/>
                              </button>
                              <button className="btn-s btn-of-light-xs"
                                      onClick={() => window.confirm('Are you sure you want to delete it?') ? null : null}>
                                <span className="icon icon-bin2 icon-12px"/>
                              </button>
                            </div>
                            : null
                        }
                        {
                          isNodeDefAttribute(childDef)
                            ? <AttributeDefComponent nodeDef={childDef}/>
                            //TODO: entity
                            // : <EntityDefComponent nodeDef={childDef} edit={edit} draft={draft}/>
                            : null
                        }
                      </React.Fragment>
                    </div>
                  )
              }

            </ResponsiveGridLayout>
            //TODO Render table
            // : '=P'
            : null
        }
      </div>
    )
  }
}

EntityDefComponent.defaultProps = {
  entityDef: {},
  draft: false,
  edit: false,
}

const mapStateToProps = (state, props) => ({
  children: getNodeDefChildren(props.nodeDef)(getSurveyState(state)),
})

export default connect(mapStateToProps, {putNodeDefProp, fetchNodeDefChildren, setFormNodDefEdit})(EntityDefComponent)