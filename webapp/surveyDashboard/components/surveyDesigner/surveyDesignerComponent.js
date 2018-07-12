import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import { appState } from '../../../app/app'
import { statePaths } from '../../surveyDashboard'
import { getSurveyDesigner } from './actions'

class SurveyDesignerComponent extends React.Component {

  componentDidMount () {
    const {getSurveyDesigner, surveyId} = this.props
    getSurveyDesigner(surveyId)
  }

  render () {

    const {surveyDesigner} = this.props
    const {
      entityDefns,
      attributeDefns,
      pages
    } = surveyDesigner

    const count = R.prop('count')

    return (
      <div className="survey-module">

        <div className="flex-center title-of">
          <span className="icon icon-quill icon-24px icon-left"/>
          <h5>Survey Designer</h5>
        </div>

        {
          R.equals(count(pages), 0)
            ? (
              <button className="btn btn-of">
                Start now!
              </button>
            )
            : (
              <div className="survey-module-item">
                <div>{count(pages)} Pages</div>
                <div>{count(entityDefns)} Entities</div>
                <div>{count(attributeDefns)} Attributes</div>
                <button className="btn btn-of-light">
                  Edit
                </button>
              </div>
            )
        }

      </div>
    )
  }

}

SurveyDesignerComponent.defaultProps = {
  surveyDesigner: {
    surveyId: -1,
    entityDefns: {count: 0},
    attributeDefns: {count: 0},
    pages: {count: 0}
  }
}

const mapStateToProps = state => ({
  surveyId: appState.surveyId(state),
  surveyDesigner: R.path(statePaths.surveyDesigner)(state)
})

export default connect(mapStateToProps, {getSurveyDesigner})(SurveyDesignerComponent)