import './formPageNavigation.scss'

import React, { useState } from 'react'
import { connect } from 'react-redux'
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { SurveyState } from '@webapp/store/survey'
import { SurveyFormActions } from '@webapp/store/ui/surveyForm'

import * as SurveyFormState from '../surveyFormState'

const NavigationButton = (props) => {
  const { surveyCycleKey, nodeDef, label, childDefs, edit, canEditDef, level, active, enabled } = props

  const dispatch = useDispatch()
  const [showChildren, setShowChildren] = useState(level === 0)

  const outerPageChildDefs = NodeDefLayout.filterNodeDefsWithPage(surveyCycleKey)(childDefs)

  return (
    <div className={`survey-form__node-def-nav level${level}`} style={{ marginLeft: `${level === 0 ? 0 : 1}rem` }}>
      <div className="display-flex">
        {outerPageChildDefs.length > 0 ? (
          <button
            className="btn-xs btn-toggle"
            style={{ transform: `rotate(${showChildren ? '90' : '0'}deg)` }}
            onClick={() => setShowChildren(!showChildren)}
          >
            <span className="icon icon-play3 icon-12px" />
          </button>
        ) : (
          <span style={{ marginLeft: '21px' }} />
        )}

        <button
          className={`btn btn-s btn-node-def${active ? ' active' : ''}`}
          onClick={() => dispatch(SurveyFormActions.setFormActivePage(nodeDef))}
          aria-disabled={!enabled}
        >
          {label}
        </button>
      </div>

      {showChildren &&
        outerPageChildDefs.map((child) => (
          <FormPageNavigation
            key={NodeDef.getUuid(child)}
            surveyCycleKey={surveyCycleKey}
            level={level + 1}
            nodeDef={child}
            edit={edit}
            canEditDef={canEditDef}
          />
        ))}
    </div>
  )
}

const mapStateToProps = (state, props) => {
  const survey = SurveyState.getSurvey(state)
  const rootNodeDef = Survey.getNodeDefRoot(survey)

  const { edit, nodeDef = rootNodeDef } = props

  const parentNode = SurveyFormState.getFormPageParentNode(nodeDef)(state)

  return {
    nodeDef,
    label: SurveyState.getNodeDefLabel(nodeDef)(state),
    childDefs: Survey.getNodeDefChildren(nodeDef)(survey),

    active: SurveyFormState.isNodeDefFormActivePage(nodeDef)(state),
    enabled: edit || NodeDef.isRoot(nodeDef) || rootNodeDef.id === nodeDef.parentId || parentNode,
  }
}

const FormPageNavigation = connect(mapStateToProps)(NavigationButton)

export default FormPageNavigation
