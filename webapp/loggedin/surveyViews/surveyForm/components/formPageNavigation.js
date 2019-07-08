import './formPageNavigation.scss'

import React, { useState } from 'react'
import { connect } from 'react-redux'

import Survey from '../../../../../common/survey/survey'
import NodeDef from '../../../../../common/survey/nodeDef'
import { filterOuterPageChildren } from '../../../../../common/survey/nodeDefLayout'

import * as SurveyState from '../../../../survey/surveyState'
import * as SurveyFormState from '../../surveyForm/surveyFormState'

import { setFormActivePage } from '../../surveyForm/actions'

const NavigationButton = (props) => {
  const {
    nodeDef, label, childDefs,
    edit, canEditDef,
    level, active, enabled,
    setFormActivePage,
  } = props

  const [showChildren, setShowChildren] = useState(level === 0)

  const outerPageChildDefs = childDefs ? filterOuterPageChildren(childDefs) : []

  return (
    <div className={`survey-form__node-def-nav level${level}`}
         style={{ marginLeft: `${level === 0 ? 0 : 1}rem` }}>
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
            level={level + 1}
            nodeDef={child}
            edit={edit}
            canEditDef={canEditDef}
          />
        )
      }

    </div>
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
  { setFormActivePage }
)(NavigationButton)

export default FormPageNavigation