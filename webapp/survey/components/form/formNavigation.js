import React from 'react'
import { connect } from 'react-redux'

import { getNodeDefChildren } from '../../../../common/survey/survey'
import { filterOuterPageChildren } from '../../../../common/survey/nodeDefLayout'

import { getFormNodeDefViewPage, getSurveyState } from '../../surveyState'

import { setFormNodeDefViewPage } from '../../nodeDef/actions'

const FormNavigationItem = (props) => {
  const {
    nodeDef,
    draft,
    children,
    currentPageNodeDef = {},
    //actions
    setFormNodeDefViewPage,
    level,
  } = props

  const outerPageChildren = children ? filterOuterPageChildren(children) : []

  const isActive = currentPageNodeDef.uuid === nodeDef.uuid
  return (
    <React.Fragment>

      <button className={`btn btn-of-light${isActive ? ' active' : ''}`}
              onClick={() => {
                // fetchNodeDefChildren(nodeDef.id, draft)
                setFormNodeDefViewPage(nodeDef)
              }}
              style={{height: `${100 - level * 10}%`}}>
        {nodeDef.props.name}
      </button>

      {
        outerPageChildren.map((child, i) =>
          <FormNavigationItemConnect key={child.uuid} nodeDef={child} draft={draft} level={level + 1}/>
        )
      }

    </React.Fragment>
  )
}

const mapStateToProps = (state, props) => ({
  children: getNodeDefChildren(props.nodeDef)(getSurveyState(state)),
  currentPageNodeDef: getFormNodeDefViewPage(state),
})
const FormNavigationItemConnect = connect(
  mapStateToProps,
  {setFormNodeDefViewPage}
)(FormNavigationItem)

const FormNavigation = ({rootNodeDef, draft}) => {

  return (
    <div className="survey-form__nav" style={{
      display: 'flex',
      alignItems: 'flex-end',
    }}>
      <FormNavigationItemConnect nodeDef={rootNodeDef} draft={draft} level={0}/>
    </div>
  )
}

export default FormNavigation