import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { uuidv4 } from '../../../../common/uuid'

import NodeDef from '../../../../common/survey/nodeDef'

import { nodeDefLayoutProps, nodeDefRenderType, isRenderForm } from '../../../../common/survey/nodeDefLayout'
import { getNodeDefIconByType, getNodeDefDefaultLayoutPropsByType } from '../nodeDefs/nodeDefSystemProps'

import { getSurvey } from '../../../survey/surveyState'

import { createNodeDef } from '../../../survey/nodeDefs/actions'
import { getNodeDefFormUnlocked, getSurveyForm } from '../surveyFormState'
import { setFormNodeDefUnlocked } from '../actions'

const AddNodeDefButton = ({ type, addNodeDef, enabled }) => {
  const isEntity = type === NodeDef.nodeDefType.entity
  const nodeDefProps = getNodeDefDefaultLayoutPropsByType(type)

  return <React.Fragment key={type}>
    {
      isEntity ?
        <div className="separator-of"/>
        : null

    }
    <button className="btn btn-s btn-of-light-s btn-add-node-def"
            onClick={() => addNodeDef(type, nodeDefProps)}
            aria-disabled={!enabled}>
      {getNodeDefIconByType(type)}{type}
    </button>
  </React.Fragment>
}

const AddNodeDefButtons = ({ addNodeDef, nodeDef }) => {
  const enabled = nodeDef && NodeDef.isNodeDefEntity(nodeDef)

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
      R.values(NodeDef.nodeDefType)
        .map(type =>
          <AddNodeDefButton key={type} type={type}
                            addNodeDef={addNodeDef}
                            enabled={type === NodeDef.nodeDefType.entity ? canAddEntity : canAddAttribute}/>
        )
    }

    <button className="btn btn-s btn-of-light-xs btn-add-node-def"
            aria-disabled={!canAddEntity}
            onClick={() => addNodeDef(
              NodeDef.nodeDefType.entity,
              {
                [nodeDefLayoutProps.render]: nodeDefRenderType.form,
                [nodeDefLayoutProps.pageUuid]: uuidv4(),
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

    this.addNodeDef = this.addNodeDef.bind(this)
  }

  componentDidUpdate (prevProps) {
    const { nodeDef } = this.props
    const { nodeDef: nodeDefPrev } = prevProps

    if ((nodeDef && !nodeDefPrev) || (!nodeDef && nodeDefPrev)) {

      const surveyFormElement = document.getElementsByClassName('survey-form')[0]
      surveyFormElement.classList.toggle('form-actions-off')

      //react-grid-layout re-render
      window.dispatchEvent(new Event('resize'))
    }
  }

  addNodeDef (type, props) {
    const { nodeDef, createNodeDef } = this.props
    createNodeDef(nodeDef.uuid, type, props)
  }

  render () {

    const { nodeDef, setFormNodeDefUnlocked } = this.props

    return (
      <div className="survey-form__actions">

        {
          nodeDef &&
          <React.Fragment>
            <button className="btn btn-s btn-of-light-xs no-border btn-toggle"
                    onClick={() => setFormNodeDefUnlocked(null)}>
              <span className="icon icon-cross icon-16px"/>
            </button>

            <AddNodeDefButtons nodeDef={nodeDef} addNodeDef={this.addNodeDef}/>
          </React.Fragment>
        }

      </div>

    )
  }

}

const mapStateToProps = state => {
  const survey = getSurvey(state)
  const surveyForm = getSurveyForm(state)

  const nodeDef = getNodeDefFormUnlocked(survey)(surveyForm)

  return {
    nodeDef
  }
}

export default connect(mapStateToProps, { createNodeDef, setFormNodeDefUnlocked })(FormActions)