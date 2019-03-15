import './surveyInfo.scss'

import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import DeleteSurveyDialog from './deleteSurveyDialog'
import ErrorBadge from '../../../../commonComponents/errorBadge'

import Survey from '../../../../../common/survey/survey'
import AuthManager from '../../../../../common/auth/authManager'
import Validator from '../../../../../common/validation/validator'

import * as AppState from '../../../../app/appState'
import * as SurveyState from '../../../../survey/surveyState'

import { appModuleUri } from '../../../appModules'
import { designerModules } from '../../../designer/designerModules'
import { homeModules } from '../../homeModules'

import { deleteSurvey, publishSurvey } from '../../../../survey/actions'

class SurveyInfo extends React.Component {

  constructor (props) {
    super(props)
    this.state = { showDeleteDialog: false }
  }

  toggleDeleteConfirmDialog (showDeleteDialog) {
    this.setState({ showDeleteDialog })
  }

  render () {
    const {
      surveyInfo, lang, canEditDef,
      publishSurvey, deleteSurvey,
    } = this.props
    const { showDeleteDialog } = this.state

    return (
      <div className="home-dashboard__survey-info">

        <ErrorBadge
          validation={Validator.getValidation(surveyInfo)}/>

        <div className="home-dashboard__survey-info-container">

          <div className="row">
            <h4 className="survey-name">
              {Survey.getLabel(surveyInfo, lang)}
            </h4>

            <div className="survey-status">
              {
                Survey.isDraft(surveyInfo) &&
                <span className="icon icon-warning icon-12px icon-left"/>
              }

              {Survey.getStatus(surveyInfo)}

              {
                canEditDef &&
                <button className="btn btn-of-light"
                        aria-disabled={!Survey.isDraft(surveyInfo)}
                        onClick={() => window.confirm('Do you want to publish this survey? Some operation won\'t be allowed afterwards.')
                          ? publishSurvey()
                          : null}>
                  <span className="icon icon-checkmark2 icon-12px icon-left"/> Publish
                </button>
              }
            </div>

            <Link to={appModuleUri(homeModules.surveyInfo)} className="btn btn-of-light">
              <span className={`icon icon-${canEditDef ? 'pencil2' : 'eye'} icon-12px icon-left`}/>
              {canEditDef ? 'Edit' : 'View'} Info
            </Link>

            {
              canEditDef &&
              <button className="btn btn-of-light" onClick={() => this.toggleDeleteConfirmDialog(true)}>
                <span className="icon icon-bin icon-12px icon-left"/> Delete
              </button>
            }
          </div>

          <div className="hr"/>

          <div className="row">
            <Link
              to={appModuleUri(designerModules.formDesigner)} className="btn btn btn-of-light">
              <span className="icon icon-quill icon-12px icon-left"/> Form Designer
            </Link>
            <Link
              to={appModuleUri(designerModules.surveyHierarchy)} className="btn btn btn-of-light">
              <span className="icon icon-tree icon-12px icon-left"/> Hierarchy
            </Link>
            <Link
              to={appModuleUri(designerModules.categories)} className="btn btn btn-of-light">
              <span className="icon icon-list2 icon-12px icon-left"/> Categories
            </Link>
            <Link
              to={appModuleUri(designerModules.taxonomies)} className="btn btn btn-of-light">
              <span className="icon icon-leaf icon-12px icon-left"/> Taxonomies
            </Link>
          </div>

        </div>

        {
          showDeleteDialog &&
          <DeleteSurveyDialog
            onCancel={() => this.toggleDeleteConfirmDialog(false)}
            onDelete={() => deleteSurvey()}
            surveyName={Survey.getName(surveyInfo)}/>
        }
      </div>
    )
  }
}

const mapStateToProps = state => {
  const user = AppState.getUser(state)
  const surveyInfo = SurveyState.getStateSurveyInfo(state)
  const lang = Survey.getDefaultLanguage(surveyInfo)

  return {
    surveyInfo,
    lang,
    canEditDef: AuthManager.canEditSurvey(user, surveyInfo),
  }
}

export default connect(
  mapStateToProps,
  { publishSurvey, deleteSurvey }
)(SurveyInfo)