import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { nodeDefType } from '../../../../common/survey/nodeDef'
import { nodeDefLayoutProps, nodeDefRenderType } from '../../../../common/survey/nodeDefLayout'
import { createNodeDef } from '../../nodeDef/actions'
import { getNodeDefIconByType } from '../../nodeDef/components/nodeDefSystemProps'

const EntityDefAddButton = ({type, addNodeDef}) => {
  const isEntity = type === nodeDefType.entity
  const nodeDefProps = isEntity ? {[nodeDefLayoutProps.render]: nodeDefRenderType.table} : {}

  return <React.Fragment key={type}>
    {
      isEntity ?
        <div className="separator-of"></div>
        : null

    }
    <button className="btn btn-s btn-of-light-s"
            onClick={() => addNodeDef(type, nodeDefProps)}>
      {getNodeDefIconByType(type)}{type}
    </button>
  </React.Fragment>
}

const EntityDefAddButtonsBar = ({addNodeDef}) => (
  <React.Fragment>
    <div/>
    <div/>
    <div/>
    <div className="title-of">
      <span className="icon icon-plus icon-left"></span> Add
    </div>

    {
      R.values(nodeDefType)
        .map(type =>
          <EntityDefAddButton key={type} type={type} addNodeDef={addNodeDef}/>
        )
    }

    <button className="btn btn-s btn-of-light-xs">
      <span className="icon icon-insert-template icon-left"></span>
      Entity New Page
    </button>
  </React.Fragment>
)

class FormActions extends React.Component {
  constructor () {
    super()
    this.state = {opened: true}

    this.addNodeDef = this.addNodeDef.bind(this)
  }

  toggleOpen () {
    const {opened} = this.state

    const width = opened ? 33 : 200
    document.getElementsByClassName('survey-form')[0].style.gridTemplateColumns = `1fr ${width}px`

    this.setState({opened: !opened})

    //react-grid-layout re-render
    window.dispatchEvent(new Event('resize'))
  }

  createNodeDef (type, props) {
    const {nodeDef, createNodeDef} = this.props
    createNodeDef(nodeDef.id, type, props)
  }

  addNodeDef (type, props) {
    this.createNodeDef(type, props)
  }

  createEntityNewPage () {
    // this.createNodeDef(nodeDefType.entity, {})
  }

  render () {

    return (
      <div className="survey-form__actions node-def__form_root">

        <div style={{opacity: '0.5', position: 'absolute'}}>
          <a className="btn btn-s btn-of-light-xs no-border"
             onClick={() => this.toggleOpen()}>
            <span className={`icon icon-${this.state.opened ? 'shrink2' : 'enlarge2'} icon-16px`}/>
          </a>
        </div>

        {
          this.state.opened ?
            <EntityDefAddButtonsBar addNodeDef={this.addNodeDef}/>
            : null
        }

      </div>

    )
  }

}

export default connect(null, {createNodeDef})(FormActions)