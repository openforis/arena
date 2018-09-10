import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { uuidv4 } from '../../../../common/uuid'

import { isNodeDefAncestor } from '../../../../common/survey/survey'
import { nodeDefType, isNodeDefEntity } from '../../../../common/survey/nodeDef'
import { nodeDefLayoutProps, nodeDefRenderType, isRenderForm } from '../../../../common/survey/nodeDefLayout'
import { getNodeDefIconByType } from '../../nodeDef/components/nodeDefSystemProps'

import { getNodeDefFormUnlocked, getFormActivePageNodeDef, getSurvey } from '../../surveyState'

import { createNodeDef } from '../../nodeDef/actions'

const AddNodeDefButton = ({type, addNodeDef, enabled}) => {
  const isEntity = type === nodeDefType.entity

  const nodeDefProps = isEntity ? {[nodeDefLayoutProps.render]: nodeDefRenderType.table, multiple: true} : {}

  return <React.Fragment key={type}>
    {
      isEntity ?
        <div className="separator-of"/>
        : null

    }
    <button className="btn btn-s btn-of-light-s"
            onClick={() => addNodeDef(type, nodeDefProps)}
            aria-disabled={!enabled}>
      {getNodeDefIconByType(type)}{type}
    </button>
  </React.Fragment>
}

const AddNodeDefButtons = ({addNodeDef, nodeDef}) => {
  const enabled = nodeDef && isNodeDefEntity(nodeDef)

  const canAddAttribute = enabled
  const canAddEntity = enabled && isRenderForm(nodeDef)

  return <React.Fragment>
    <div/>
    <div/>
    <div/>
    <div className="title-of">
      <span className="icon icon-plus icon-left"/> Add
    </div>

    {
      R.values(nodeDefType)
        .map(type =>
          <AddNodeDefButton key={type} type={type}
                            addNodeDef={addNodeDef}
                            enabled={type === nodeDefType.entity ? canAddEntity : canAddAttribute}/>
        )
    }

    <button className="btn btn-s btn-of-light-xs"
            aria-disabled={!canAddEntity}
            onClick={() => addNodeDef(
              nodeDefType.entity,
              {
                [nodeDefLayoutProps.render]: nodeDefRenderType.form,
                [nodeDefLayoutProps.pageUUID]: uuidv4(),
              }
            )}>
      <span className="icon icon-insert-template icon-left"/>
      Entity New Page
    </button>

  </React.Fragment>
}

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

  addNodeDef (type, props) {
    const {nodeDef, createNodeDef} = this.props
    createNodeDef(nodeDef.id, type, props)
  }

  render () {

    const {nodeDef} = this.props

    return (
      <div className="survey-form__actions node-def__form_page">

        <div style={{opacity: '0.5', position: 'absolute'}}>
          <a className="btn btn-s btn-of-light-xs no-border"
             onClick={() => this.toggleOpen()}>
            <span className={`icon icon-${this.state.opened ? 'shrink2' : 'enlarge2'} icon-16px`}/>
          </a>
        </div>

        {
          this.state.opened ?
            <AddNodeDefButtons nodeDef={nodeDef} addNodeDef={this.addNodeDef}/>
            : null
        }

      </div>

    )
  }

}

const mapStateToProps = state => {
  const nodeDefUnlocked = getNodeDefFormUnlocked(state)
  const nodeDefActivePage = getFormActivePageNodeDef(state)

  const nodeDef =
    nodeDefUnlocked &&
    (nodeDefActivePage.uuid === nodeDefUnlocked.uuid || isNodeDefAncestor(nodeDefActivePage, nodeDefUnlocked)(getSurvey(state)))
      ? nodeDefUnlocked
      : null

  return {
    nodeDef
  }
}

export default connect(mapStateToProps, {createNodeDef})(FormActions)