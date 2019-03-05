import './surveyInfo.scss'

import React from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'

import DeleteSurveyDialog from './deleteSurveyDialog'
import ErrorBadge from '../../../../commonComponents/errorBadge'

import Survey from '../../../../../common/survey/survey'
import AuthManager from '../../../../../common/auth/authManager'
import Validator from '../../../../../common/validation/validator'

import { appModuleUri } from '../../../appModules'
import { designerModules } from '../../../designer/designerModules'
import { homeModules } from '../../homeModules'

import * as AppState from '../../../../app/appState'
import * as SurveyState from '../../../../survey/surveyState'

import { deleteSurvey, publishSurvey } from '../../../../survey/actions'

class SurveyActionBar extends React.Component {

  constructor (props) {
    super(props)
    this.state = { showDeleteDialog: false }
  }

  toggleDeleteConfirmDialog (showDeleteDialog) {
    this.setState({ showDeleteDialog })
  }

  componentDidUpdate (prevProps) {
    const { surveyInfo, history } = this.props
    const { surveyInfo: prevSurveyInfo } = prevProps

    // redirecting when survey has been deleted
    if (Survey.isValid(prevSurveyInfo) && !Survey.isValid(surveyInfo)) {
      history.push(appModuleUri(homeModules.surveyList))
    }
  }

  render () {
    const {
      surveyInfo, canEditDef,
      publishSurvey, deleteSurvey,
    } = this.props
    const { showDeleteDialog } = this.state

    return (
      <div className="home-dashboard__survey-info">

        <ErrorBadge validation={Validator.getValidation(surveyInfo)}/>

        <div className="home-dashboard__survey-info-side">
          <Link to={appModuleUri(homeModules.surveyList)} className="btn btn-of-light">
            <span className="icon icon-paragraph-justify icon-12px icon-left"/> Survey list
          </Link>
          <Link to={appModuleUri(homeModules.surveyNew)} className="btn btn-of-light">
            <span className="icon icon-plus icon-12px icon-left"/> New Survey
          </Link>
        </div>

        <div className="home-dashboard__survey-info-container">
          <div className="survey-status">
            {
              Survey.isDraft(surveyInfo) &&
              <span className="icon icon-warning icon-12px icon-left"/>
            }

            {Survey.getStatus(surveyInfo)}
          </div>

          <h4 className="survey-name">
            {Survey.getName(surveyInfo)}
          </h4>

          <div className="row-btns">
            <Link to={appModuleUri(designerModules.surveyInfo)} className="btn btn-of-light">
              <span className={`icon icon-${canEditDef ? 'pencil2' : 'eye'} icon-12px icon-left`}/>
              {canEditDef ? 'Edit' : ''} Info
            </Link>

            {canEditDef &&
            <button className="btn btn-of-light" aria-disabled={!Survey.isDraft(surveyInfo)}
                    onClick={() => window.confirm('Do you want to publish this survey? Some operation won\'t be allowed afterwards.')
                      ? publishSurvey()
                      : null}>
              <span className="icon icon-checkmark2 icon-12px icon-left"/> Publish
            </button>
            }

            {canEditDef &&
            <button className="btn btn-of-light" onClick={() => this.toggleDeleteConfirmDialog(true)}>
              <span className="icon icon-bin icon-12px icon-left"/> Delete
            </button>
            }

            {showDeleteDialog &&
            <DeleteSurveyDialog onCancel={() => this.toggleDeleteConfirmDialog(false)}
                                onDelete={() => deleteSurvey()}
                                surveyName={Survey.getName(surveyInfo)}/>
            }
          </div>

          <div className="row-btns">
            <Link to={appModuleUri(designerModules.formDesigner)} className="btn btn btn-of-light">
              <span className="icon icon-quill icon-12px icon-left"/> Form Designer
            </Link>
            <Link to={appModuleUri(designerModules.surveyHierarchy)} className="btn btn btn-of-light">
              <span className="icon icon-quill icon-12px icon-left"/> Hierarchy
            </Link>
            <Link to={appModuleUri(designerModules.categories)} className="btn btn btn-of-light">
              <span className="icon icon-list2 icon-12px icon-left"/> Categories
            </Link>
            <Link to={appModuleUri(designerModules.taxonomies)} className="btn btn btn-of-light">
              <span className="icon icon-leaf icon-12px icon-left"/> Taxonomies
            </Link>
          </div>

        </div>

      </div>
    )
  }
}

const mapStateToProps = state => {
  const user = AppState.getUser(state)
  const surveyInfo = SurveyState.getStateSurveyInfo(state)

  return {
    surveyInfo,
    canEditDef: AuthManager.canEditSurvey(user, surveyInfo),
  }
}

const enhance = compose(
  withRouter,
  connect(mapStateToProps, { publishSurvey, deleteSurvey })
)

export default enhance(SurveyActionBar)