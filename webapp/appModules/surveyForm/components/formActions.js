import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import NodeDef from '../../../../common/survey/nodeDef'

import { getNodeDefIconByType, getNodeDefDefaultLayoutPropsByType } from '../nodeDefs/nodeDefSystemProps'

import { createNodeDef } from '../../../survey/nodeDefs/actions'
import { setFormNodeDefUnlocked } from '../actions'

import * as SurveyFormState from '../surveyFormState'

const AddNodeDefButtons = ({ addNodeDef }) => (
  <React.Fragment>
    <div/>
    <div/>
    <div/>
    <div className="title-of">
      <span className="icon icon-plus icon-left"/> Add
    </div>

    {
      R.values(NodeDef.nodeDefType)
        .map(type => {
          const nodeDefProps = getNodeDefDefaultLayoutPropsByType(type)

          return (
            <button key={type}
                    className="btn btn-s btn-of-light-s btn-add-node-def"
                    onClick={() => addNodeDef(type, nodeDefProps)}>
              {getNodeDefIconByType(type)}{type}
            </button>
          )
        })
    }

  </React.Fragment>
)

class FormActions extends React.Component {

  constructor (props) {
    super(props)
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

const mapStateToProps = state => ({
  nodeDef: SurveyFormState.getNodeDefAddChildTo(state)
})

export default connect(
  mapStateToProps,
  { createNodeDef, setFormNodeDefUnlocked }
)(FormActions)