import './formPageNavigation.scss'

import React, { useState } from 'react'
import { connect, useDispatch } from 'react-redux'
import classNames from 'classnames'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { SurveyState } from '@webapp/store/survey'
import { SurveyFormActions, SurveyFormState } from '@webapp/store/ui/surveyForm'
import { useOnUpdate } from '@webapp/components/hooks'

const NavigationButton = (props) => {
  const {
    surveyCycleKey,
    nodeDef,
    label,
    childDefs,
    edit,
    canEditDef,
    level,
    active,
    enabled,
    isRoot,
    expandedFormPageNavigation,
    toggleExpandedFormPageNavigation,
  } = props

  const dispatch = useDispatch()
  const [showChildren, setShowChildren] = useState(expandedFormPageNavigation || level === 0)

  const outerPageChildDefs = NodeDefLayout.filterNodeDefsWithPage(surveyCycleKey)(childDefs)
  useOnUpdate(() => {
    setShowChildren(expandedFormPageNavigation)
  }, [expandedFormPageNavigation])

  return (
    <div className={`survey-form__node-def-nav level${level}`} style={{ marginLeft: `${level === 0 ? 0 : 1}rem` }}>
      {isRoot && (
        <div className="display-flex">
          <button className="btn-xs btn-toggle" onClick={toggleExpandedFormPageNavigation}>
            <span
              className="icon icon-play3 icon-12px"
              className={classNames('icon icon-12px', {
                'icon-shrink2': expandedFormPageNavigation,
                'icon-enlarge2': !expandedFormPageNavigation,
              })}
            />
          </button>
        </div>
      )}
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
    isRoot: NodeDef.isRoot(nodeDef),
    expandedFormPageNavigation: SurveyFormState.expandedPageNavigation(state),
  }
}

const FormPageNavigation = connect(mapStateToProps, {
  toggleExpandedFormPageNavigation: SurveyFormActions.toggleExpandedFormPageNavigation,
})(NavigationButton)

export default FormPageNavigation
