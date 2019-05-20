import './nodeDefNavigation.scss'

import React from 'react'
import { connect } from 'react-redux'

import useI18n from '../../../../commonComponents/useI18n'

import Survey from '../../../../../common/survey/survey'
import NodeDef from '../../../../../common/survey/nodeDef'
import { uuidv4 } from '../../../../../common/uuid'

import { filterOuterPageChildren, nodeDefLayoutProps, nodeDefRenderType } from '../../../../../common/survey/nodeDefLayout'

import * as SurveyState from '../../../../survey/surveyState'
import * as SurveyFormState from '../../surveyForm/surveyFormState'

import { setFormActivePage } from '../../surveyForm/actions'
import { createNodeDef } from '../../../../survey/nodeDefs/actions'

const NavigationButton = (props) => {
  const {
    nodeDef,
    childDefs,
    edit,
    canEditDef,

    label,
    level,
    active,
    enabled,

    setFormActivePage,
    createNodeDef,
  } = props

  const i18n = useI18n()

  const outerPageChildDefs = childDefs ? filterOuterPageChildren(childDefs) : []

  return (
    <React.Fragment>

      <button className={`btn btn-of-light${active ? ' active' : ''}`}
              onClick={() => setFormActivePage(nodeDef)}
              style={{ height: `${100 - level * 7}%` }}
              aria-disabled={!enabled}>
        {label}
      </button>

      {
        outerPageChildDefs.map(child =>
          <NodeDefNavigation key={NodeDef.getUuid(child)}
                             level={level + 1}
                             nodeDef={child}
                             edit={edit}
                             canEditDef={canEditDef}
          />
        )
      }

      {
        edit && active && canEditDef && level < 6 &&
        <button className="btn btn-of-light node-def-nav__btn-add-page"
                style={{ height: `${100 - (level + 1) * 7}%` }}
                onClick={() => createNodeDef(
                  NodeDef.getUuid(nodeDef),
                  NodeDef.nodeDefType.entity,
                  {
                    [nodeDefLayoutProps.render]: nodeDefRenderType.form,
                    [nodeDefLayoutProps.pageUuid]: uuidv4(),
                  }
                )}>
          <span className="icon icon-plus icon-12px icon-left"/>
          {label} {i18n.t('surveyForm.nodeDefNavigation.subPage')}
        </button>
      }
    </React.Fragment>
  )
}

const mapStateToProps = (state, props) => {
  const survey = SurveyState.getSurvey(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const rootNodeDef = Survey.getRootNodeDef(survey)

  const { edit, nodeDef = rootNodeDef } = props

  const parentNode = SurveyFormState.getFormPageParentNode(nodeDef)(state)

  return {
    nodeDef,
    childDefs: Survey.getNodeDefChildren(nodeDef)(survey),
    label: NodeDef.getLabel(nodeDef, Survey.getDefaultLanguage(surveyInfo)),

    active: SurveyFormState.isNodeDefFormActivePage(nodeDef)(state),
    enabled: edit || NodeDef.isRoot(nodeDef) || rootNodeDef.id === nodeDef.parentId || parentNode,
  }
}

const NodeDefNavigation = connect(
  mapStateToProps,
  { setFormActivePage, createNodeDef }
)(NavigationButton)

export default NodeDefNavigation