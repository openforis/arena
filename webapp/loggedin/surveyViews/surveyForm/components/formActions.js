import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { dispatchWindowResize } from '../../../../utils/domUtils'

import NodeDef from '../../../../../common/survey/nodeDef'
import NodeDefLayout from '../../../../../common/survey/nodeDefLayout'

import { getNodeDefIconByType, getNodeDefDefaultLayoutPropsByType } from '../nodeDefs/nodeDefSystemProps'

import * as SurveyFormState from '../surveyFormState'

import { createNodeDef } from '../../../../survey/nodeDefs/actions'
import { setFormNodeDefAddChildTo } from '../actions'

const AddNodeDefButtons = ({ nodeDef, addNodeDef, setFormNodeDefAddChildTo }) => {

  return (
    <React.Fragment>

      {
        R.values(NodeDef.nodeDefType)
          .map(type => {
            const nodeDefProps = getNodeDefDefaultLayoutPropsByType(type)

            // cannot add entities when entity is rendered as table
            const disabled = type === NodeDef.nodeDefType.entity && NodeDefLayout.isRenderTable(nodeDef)

            return (
              <button key={type}
                      className="btn btn-s btn-add-node-def"
                      onClick={() => {
                        addNodeDef(type, nodeDefProps)
                        setFormNodeDefAddChildTo(null)
                      }}
                      aria-disabled={disabled}>
                {getNodeDefIconByType(type)}{type}
              </button>
            )
          })
      }

    </React.Fragment>
  )
}

class FormActions extends React.Component {

  constructor (props) {
    super(props)
    this.addNodeDef = this.addNodeDef.bind(this)
  }

  componentDidUpdate (prevProps) {
    const { nodeDef } = this.props
    const { nodeDef: nodeDefPrev } = prevProps

    if ((nodeDef && !nodeDefPrev) || (!nodeDef && nodeDefPrev)) {
      //react-grid-layout re-render
      dispatchWindowResize()
    }
  }

  componentWillUnmount () {
    this.props.setFormNodeDefAddChildTo(null)
  }

  addNodeDef (type, props) {
    const { nodeDef, createNodeDef } = this.props
    createNodeDef(NodeDef.getUuid(nodeDef), type, props)
  }

  render () {
    const { nodeDef, setFormNodeDefAddChildTo } = this.props

    return nodeDef && (
      <div className="survey-form__actions">

        <button className="btn btn-s no-border btn-toggle"
                onClick={() => setFormNodeDefAddChildTo(null)}>
          <span className="icon icon-cross icon-12px"/>
        </button>

        <AddNodeDefButtons
          nodeDef={nodeDef}
          addNodeDef={this.addNodeDef}
          setFormNodeDefAddChildTo={setFormNodeDefAddChildTo}
        />

      </div>

    )
  }

}

const mapStateToProps = state => ({
  nodeDef: SurveyFormState.getNodeDefAddChildTo(state),
})

export default connect(
  mapStateToProps,
  { createNodeDef, setFormNodeDefAddChildTo }
)(FormActions)