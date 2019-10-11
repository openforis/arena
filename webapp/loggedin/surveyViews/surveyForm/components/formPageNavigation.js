import './formPageNavigation.scss'

import React, { useState } from 'react'
import { connect } from 'react-redux'

import Survey from '../../../../../core/survey/survey'
import NodeDef from '../../../../../core/survey/nodeDef'
import NodeDefLayout from '../../../../../core/survey/nodeDefLayout'

import * as SurveyState from '../../../../survey/surveyState'
import * as SurveyFormState from '../../surveyForm/surveyFormState'

import { setFormActivePage, toggleFormPageNavigation } from '../../surveyForm/actions'

const NavigationButton = (props) => {
  const {
    surveyCycleKey, nodeDef, label, childDefs,
    edit, canEditDef,
    level, active, enabled,
    showPageNavigation,
    setFormActivePage, toggleFormPageNavigation,
  } = props

  const [showChildren, setShowChildren] = useState(level === 0)

  const outerPageChildDefs = NodeDefLayout.filterNodeDefsWithPage(surveyCycleKey)(childDefs)

  return (
    showPageNavigation
      ? (
        <div className={`survey-form__node-def-nav level${level}`}
             style={{ marginLeft: `${level === 0 ? 0 : 1}rem` }}>

          {
            level === 0 &&
            <button className="btn-s btn-transparent survey-form__node-def-nav__btn-toggle"
                    onClick={toggleFormPageNavigation}>
              <span className="icon icon-shrink2 icon-12px icon-left"/>
            </button>
          }

          <div className="display-flex">
            {
              outerPageChildDefs.length > 0 ?
                (
                  <button className="btn-xs btn-toggle"
                          style={{ transform: `rotate(${showChildren ? '90' : '0'}deg)` }}
                          onClick={() => setShowChildren(!showChildren)}>
                    <span className="icon icon-play3 icon-12px"/>
                  </button>
                )
                : (
                  <span style={{ marginLeft: '21px' }}/>
                )
            }

            <button className={`btn btn-s btn-node-def${active ? ' active' : ''}`}
                    onClick={() => setFormActivePage(nodeDef)}
                    aria-disabled={!enabled}>
              {label}
            </button>
          </div>

          {
            showChildren && outerPageChildDefs.map(child =>
              <FormPageNavigation
                key={NodeDef.getUuid(child)}
                surveyCycleKey={surveyCycleKey}
                level={level + 1}
                nodeDef={child}
                edit={edit}
                canEditDef={canEditDef}
                showPageNavigation={showPageNavigation}
              />
            )
          }

        </div>
      )
      : (
        <button className="btn-s btn-transparent survey-form__node-def-nav__btn-toggle"
                onClick={toggleFormPageNavigation}>
          <span className="icon icon-enlarge2 icon-12px icon-left"/>
        </button>
      )
  )
}

const mapStateToProps = (state, props) => {
  const survey = SurveyState.getSurvey(state)
  const rootNodeDef = Survey.getRootNodeDef(survey)

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

const FormPageNavigation = connect(
  mapStateToProps,
  { setFormActivePage, toggleFormPageNavigation }
)(NavigationButton)

export default FormPageNavigation