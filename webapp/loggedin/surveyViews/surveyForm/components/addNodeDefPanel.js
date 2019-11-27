import './addNodeDefPanel.scss'

import React from 'react'
import {connect} from 'react-redux'
import * as R from 'ramda'

import {useI18n} from '@webapp/commonComponents/hooks'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as SurveyState from '@webapp/survey/surveyState'
import {createNodeDef} from '@webapp/survey/nodeDefs/actions'
import * as NodeDefUIProps from '../nodeDefs/nodeDefUIProps'

import * as SurveyFormState from '../surveyFormState'

import {setFormNodeDefAddChildTo} from '../actions'

const AddNodeDefButtons = props => {
  const {surveyCycleKey, nodeDef, addNodeDef, setFormNodeDefAddChildTo} = props

  return (
    <React.Fragment>

      {
        R.values(NodeDef.nodeDefType)
          .map(type => {
            const nodeDefProps = NodeDefUIProps.getDefaultPropsByType(type, surveyCycleKey)

            // Cannot add entities when entity is rendered as table
            const disabled = type === NodeDef.nodeDefType.entity && NodeDefLayout.isRenderTable(surveyCycleKey)(nodeDef)

            return (
              <button key={type}
                className="btn btn-s btn-add-node-def"
                onClick={() => {
                  addNodeDef(type, nodeDefProps)
                  setFormNodeDefAddChildTo(null)
                }}
                aria-disabled={disabled}>
                {type}
                {NodeDefUIProps.getIconByType(type)}
              </button>
            )
          })
      }

    </React.Fragment>
  )
}

const AddNodeDefPanel = props => {
  const {
    surveyCycleKey, nodeDef, nodeDefLabel,
    createNodeDef, setFormNodeDefAddChildTo
  } = props

  const i18n = useI18n()

  return nodeDef && (
    <div className="survey-form__add-node-def-panel">

      <button className="btn btn-s no-border btn-toggle"
        onClick={() => setFormNodeDefAddChildTo(null)}>
        <span className="icon icon-cross icon-12px"/>
      </button>

      <div className="flex-center add-to-label">
        <span className="icon icon-plus icon-10px icon-left"/>
        {i18n.t('surveyForm.addChildTo', {nodeDef: nodeDefLabel})}
      </div>

      <AddNodeDefButtons
        surveyCycleKey={surveyCycleKey}
        nodeDef={nodeDef}
        addNodeDef={(type, props) => {
          createNodeDef(nodeDef, type, props)
        }}
        setFormNodeDefAddChildTo={setFormNodeDefAddChildTo}
      />

    </div>

  )
}

const mapStateToProps = state => {
  const nodeDef = SurveyFormState.getNodeDefAddChildTo(state)
  return {
    surveyCycleKey: SurveyState.getSurveyCycleKey(state),
    nodeDef,
    nodeDefLabel: SurveyState.getNodeDefLabel(nodeDef)(state)
  }
}

export default connect(
  mapStateToProps,
  {createNodeDef, setFormNodeDefAddChildTo}
)(AddNodeDefPanel)
