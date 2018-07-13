import React from 'react'
import { connect } from 'react-redux'
import {Link} from 'react-router-dom'

import * as R from 'ramda'

import DataFetchComponent from '../dataFetchComponent'
import { appState, appModules, appUri } from '../../../app/app'
import { statePaths } from '../../surveyDashboard'

class SurveyDesignerComponent extends React.Component {

  render () {
    const {surveyDesigner} = this.props

    const {
      entityDefns,
      attributeDefns,
      pages
    } = surveyDesigner

    const count = R.prop('count')

    return (
      <DataFetchComponent module={appModules.surveyDesigner}>
        <div className="survey-module">

          <div className="flex-center title-of">
            <span className="icon icon-quill icon-24px icon-left"/>
            <h5>Survey Designer</h5>
          </div>

          {
            R.equals(count(entityDefns), 0)
              ? (
                null
              )
              : (
                <div className="survey-module-item">
                  <div>{count(pages)} Pages</div>
                  <div>{count(entityDefns)} Entities</div>
                  <div>{count(attributeDefns)} Attributes</div>

                </div>
              )
          }

          <Link to={appUri(appModules.surveyDesigner)} className="btn btn-of">
            <span className="icon icon-quill icon-left"></span>
            Design
          </Link>

        </div>
      </DataFetchComponent>
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

export default connect(mapStateToProps)(SurveyDesignerComponent)