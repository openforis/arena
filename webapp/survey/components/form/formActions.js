import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { nodeDefType } from '../../../../common/survey/nodeDef'
import { nodeDefLayoutProps, nodeDefRenderType } from '../../../../common/survey/nodeDefLayout'
import { createNodeDef } from '../../nodeDef/actions'
import { getNodeDefIconByType } from '../../nodeDef/components/nodeDefSystemProps'
import { getNodeDefFormUnlocked } from '../../surveyState'

const EntityDefAddButton = ({type, addNodeDef, enabled}) => {
  const isEntity = type === nodeDefType.entity
  const nodeDefProps = isEntity ? {[nodeDefLayoutProps.render]: nodeDefRenderType.table} : {}

  return <React.Fragment key={type}>
    {
      isEntity ?
        <div className="separator-of"></div>
        : null

    }
    <button className="btn btn-s btn-of-light-s"
            onClick={() => addNodeDef(type, nodeDefProps)}
            aria-disabled={!enabled}>
      {getNodeDefIconByType(type)}{type}
    </button>
  </React.Fragment>
}

const EntityDefAddButtonsBar = ({addNodeDef, enabled}) => (
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
          <EntityDefAddButton key={type} type={type} addNodeDef={addNodeDef} enabled={enabled}/>
        )
    }

    <button className="btn btn-s btn-of-light-xs"
            aria-disabled={!enabled}>
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

    const {nodeDef} = this.props
    const enabled = nodeDef && nodeDef.type === nodeDefType.entity

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
            <EntityDefAddButtonsBar enabled={enabled} addNodeDef={this.addNodeDef}/>
            : null
        }

      </div>

    )
  }

}

const mapStateToProps = state => ({
  nodeDef: getNodeDefFormUnlocked(state)
})

export default connect(mapStateToProps, {createNodeDef})(FormActions)