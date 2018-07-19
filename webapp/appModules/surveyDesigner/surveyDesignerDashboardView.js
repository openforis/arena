import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import * as R from 'ramda'

import DataFetchComponent from '../components/moduleDataFetchComponent'
import { appModuleUri } from '../../app/app'
import { appModules, getDashboardData } from '../appModules'

class SurveyDesignerDashboardView extends React.Component {

  render () {
    const {surveyDesigner} = this.props

    const {
      entityDefns,
      attributeDefns,
      pages
    } = surveyDesigner

    const count = R.prop('count')

    return (
      <DataFetchComponent module={appModules.surveyDesigner} dashboard={true}>
        <div className="app-dashboard__module">

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
                <div className="app-dashboard__module-item">
                  <div>{count(pages)} Pages</div>
                  <div>{count(entityDefns)} Entities</div>
                  <div>{count(attributeDefns)} Attributes</div>

                </div>
              )
          }

          <Link to={appModuleUri(appModules.surveyDesigner)} className="btn btn-of">
            <span className="icon icon-quill icon-left"></span>
            Design
          </Link>

        </div>
      </DataFetchComponent>
    )
  }

}

SurveyDesignerDashboardView.defaultProps = {
  surveyDesigner: {
    getSurveyId: -1,
    entityDefns: {count: 0},
    attributeDefns: {count: 0},
    pages: {count: 0}
  }
}

const mapStateToProps = state => ({
  surveyDesigner: getDashboardData(appModules.surveyDesigner)(state)
})

export default connect(mapStateToProps)(SurveyDesignerDashboardView)