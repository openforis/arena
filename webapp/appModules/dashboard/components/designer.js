import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import * as R from 'ramda'

import { appModuleUri } from '../../appModules'
import { appModules } from '../../appModules'

import { getUser } from '../../../app/appState'
import { getSurvey } from '../../../survey/surveyState'

import {canEditSurvey} from '../../../../common/auth/authManager'

class Designer extends React.Component {

  render () {
    const {surveyDesigner, user, survey} = this.props

    const {
      entityDefns,
      attributeDefns,
      pages,
    } = surveyDesigner

    const count = R.prop('count')

    return (
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

          <Link to={appModuleUri(appModules.designer)} className="btn btn-of">
            <span className="icon icon-quill icon-left"></span>
            Design
          </Link>
        </div>

    )
  }

}

Designer.defaultProps = {
  surveyDesigner: {
    surveyId: -1,
    entityDefns: {count: 0},
    attributeDefns: {count: 0},
    pages: {count: 0}
  }
}

const mapStateToProps = state => ({
  user: getUser(state),
  survey: getSurvey(state)
})

export default connect(mapStateToProps)(Designer)