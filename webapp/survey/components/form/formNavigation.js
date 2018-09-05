import React from 'react'
import { connect } from 'react-redux'

import { getNodeDefChildren, getSurveyDefaultLanguage } from '../../../../common/survey/survey'
import { filterOuterPageChildren } from '../../../../common/survey/nodeDefLayout'

import { getFormActivePageNodeDef, getSurvey, isNodeDefFormActivePage } from '../../surveyState'

import { setFormActivePage } from '../../nodeDef/actions'
import { getNodeDefLabel } from '../../../../common/survey/nodeDef'

const FormNavigationItem = (props) => {
  const {
    nodeDef,
    childDefs,
    node,
    parentNode,
    label,
    level,
    isActive,
    setFormActivePage,
  } = props

  const outerPageChildDefs = childDefs ? filterOuterPageChildren(childDefs) : []

  return (
    <React.Fragment>

      <button className={`btn btn-of-light${isActive ? ' active' : ''}`}
              onClick={() => {
                // fetchNodeDefChildren(nodeDef.id, draft)
                setFormActivePage(nodeDef, node, parentNode)
              }}
              style={{height: `${100 - level * 10}%`}}>
        {label}
      </button>

      {
        outerPageChildDefs.map((child, i) =>
          <FormNavigationItemConnect key={child.uuid}
                                     level={level + 1}
                                     nodeDef={child}
                                     node={{}}
                                     parentNode={node}
          />
        )
      }

    </React.Fragment>
  )
}

const mapStateToProps = (state, props) => {
  const survey = getSurvey(state)
  const {nodeDef} = props

  return {
    childDefs: getNodeDefChildren(nodeDef)(survey),
    currentPageNodeDef: getFormActivePageNodeDef(state),
    isActive: isNodeDefFormActivePage(nodeDef)(survey),
    label: getNodeDefLabel(nodeDef, getSurveyDefaultLanguage(survey)),
  }
}

const FormNavigationItemConnect = connect(
  mapStateToProps,
  {setFormActivePage}
)(FormNavigationItem)

const FormNavigation = ({rootNodeDef, rootNode}) => {

  return (
    <div className="survey-form__nav" style={{
      display: 'flex',
      alignItems: 'flex-end',
    }}>
      <FormNavigationItemConnect nodeDef={rootNodeDef} node={rootNode} level={0}/>
    </div>
  )
}

export default FormNavigation