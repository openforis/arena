import './addNodeDefPanel.scss'

import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'
import { useNavigate } from 'react-router'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { NodeDefsActions, SurveyState } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { SurveyFormActions, SurveyFormState } from '@webapp/store/ui/surveyForm'
import { TestId } from '@webapp/utils/testId'

import * as NodeDefUIProps from '../nodeDefs/nodeDefUIProps'

const AddNodeDefButtons = (props) => {
  const { surveyCycleKey, nodeDef, addNodeDef } = props

  const i18n = useI18n()

  return (
    <>
      {R.values(NodeDef.nodeDefType).map((type) => {
        const nodeDefProps = NodeDefUIProps.getDefaultPropsByType(type, surveyCycleKey)

        // Cannot add entities when entity is rendered as table
        const disabled = type === NodeDef.nodeDefType.entity && NodeDefLayout.isRenderTable(surveyCycleKey)(nodeDef)

        return (
          <button
            key={type}
            className={`btn btn-s btn-add-node-def ${type}`}
            data-testid={TestId.surveyForm.nodeDefAddChildOfTypeBtn(type)}
            onClick={() => {
              addNodeDef(type, nodeDefProps)
            }}
            aria-disabled={disabled}
          >
            {i18n.t(`surveyForm.addChildToTypes.${type}`)}
            {NodeDefUIProps.getIconByType(type)}
          </button>
        )
      })}
    </>
  )
}

const AddNodeDefPanel = (props) => {
  const { surveyCycleKey, nodeDef, nodeDefLabel, createNodeDef, setFormNodeDefAddChildTo } = props

  const i18n = useI18n()
  const navigate = useNavigate()

  return (
    nodeDef && (
      <div className="survey-form__add-node-def-panel">
        <button className="btn btn-s no-border btn-toggle" onClick={() => setFormNodeDefAddChildTo(null)}>
          <span className="icon icon-cross icon-12px" />
        </button>

        <div className="flex-center add-to-label">
          <span className="icon icon-plus icon-10px icon-left" />
          {i18n.t('surveyForm.addChildTo', { nodeDefLabel })}
        </div>

        <AddNodeDefButtons
          surveyCycleKey={surveyCycleKey}
          nodeDef={nodeDef}
          addNodeDef={(type, props) => {
            createNodeDef(nodeDef, type, props, navigate)
          }}
          setFormNodeDefAddChildTo={setFormNodeDefAddChildTo}
        />
      </div>
    )
  )
}

const mapStateToProps = (state) => {
  const nodeDef = SurveyFormState.getNodeDefAddChildTo(state)
  return {
    surveyCycleKey: SurveyState.getSurveyCycleKey(state),
    nodeDef,
    nodeDefLabel: SurveyState.getNodeDefLabel(nodeDef)(state),
  }
}

export default connect(mapStateToProps, {
  createNodeDef: NodeDefsActions.createNodeDef,
  setFormNodeDefAddChildTo: SurveyFormActions.setFormNodeDefAddChildTo,
})(AddNodeDefPanel)
