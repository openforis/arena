import './nodeDefNavigation.scss'

import React from 'react'
import { connect } from 'react-redux'

import Survey from '../../../../common/survey/survey'
import NodeDef from '../../../../common/survey/nodeDef'
import { uuidv4 } from '../../../../common/uuid'

import { filterOuterPageChildren, nodeDefLayoutProps, nodeDefRenderType } from '../../../../common/survey/nodeDefLayout'

import { getStateSurveyInfo, getSurvey } from '../../../survey/surveyState'
import { getFormPageParentNode, getSurveyForm, isNodeDefFormActivePage } from '../surveyFormState'

import { setFormActivePage } from '../actions'
import { createNodeDef } from '../../../survey/nodeDefs/actions'

const NavigationButton = (props) => {
  const {
    nodeDef,
    childDefs,
    edit,

    label,
    level,
    active,
    enabled,

    setFormActivePage,
    createNodeDef,
  } = props

  const outerPageChildDefs = childDefs ? filterOuterPageChildren(childDefs) : []

  return (
    <React.Fragment>

      <button className={`btn btn-of-light${active ? ' active' : ''}`}
              onClick={() => setFormActivePage(nodeDef)}
              style={{ height: `${100 - level * 12.5}%` }}
              aria-disabled={!enabled}>
        {label}
      </button>

      {
        outerPageChildDefs.map(child =>
          <NodeDefNavigation key={NodeDef.getUuid(child)}
                             level={level + 1}
                             nodeDef={child}
                             edit={edit}
          />
        )
      }

      {
        edit && active &&
        <button className="btn btn-of-light node-def-nav__btn-add-page"
                style={{ height: `${100 - (level + 1) * 12.5}%` }}
                onClick={() => createNodeDef(
                  NodeDef.getUuid(nodeDef),
                  NodeDef.nodeDefType.entity,
                  {
                    [nodeDefLayoutProps.render]: nodeDefRenderType.form,
                    [nodeDefLayoutProps.pageUuid]: uuidv4(),
                  }
                )}>
          <span className="icon icon-plus icon-12px icon-left"/>
          {label} sub page
        </button>
      }
    </React.Fragment>
  )
}

const mapStateToProps = (state, props) => {
  const survey = getSurvey(state)
  const surveyInfo = getStateSurveyInfo(state)
  const rootNodeDef = Survey.getRootNodeDef(survey)
  const surveyForm = getSurveyForm(state)

  const { edit, nodeDef = rootNodeDef } = props
  const parentNode = getFormPageParentNode(survey, nodeDef)(surveyForm)

  return {
    nodeDef,
    childDefs: Survey.getNodeDefChildren(nodeDef)(survey),
    label: NodeDef.getNodeDefLabel(nodeDef, Survey.getDefaultLanguage(surveyInfo)),

    active: isNodeDefFormActivePage(survey, nodeDef)(surveyForm),
    enabled: edit || NodeDef.isNodeDefRoot(nodeDef) || rootNodeDef.id === nodeDef.parentId || parentNode,
  }
}

const NodeDefNavigation = connect(
  mapStateToProps,
  { setFormActivePage, createNodeDef }
)(NavigationButton)

export default NodeDefNavigation