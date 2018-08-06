import React from 'react'
import { connect } from 'react-redux'

import { filterOuterPageChildren } from '../../../../common/survey/nodeDefLayout'
import { getNodeDefChildren, getSurveyState } from '../../surveyState'

const FormNavigationItem = ({nodeDef, children}) => {

  return (
    <React.Fragment>
      <button className="btn btn-of-light">{nodeDef.props.name}</button>

    </React.Fragment>
  )
}

const mapStateToProps = (state, props) => ({
  children: getNodeDefChildren(props.nodeDef)(getSurveyState(state)),
})
const FormNavigationItemConnect = connect(mapStateToProps)(FormNavigationItem)

const FormNavigation = ({nodeDef}) => {

  return (
    <div className="survey-form__nav" style={{
      display: 'flex',
      alignItems: 'flex-end',
    }}>
      <FormNavigationItemConnect nodeDef={nodeDef}/>
    </div>
  )
}

export default FormNavigation