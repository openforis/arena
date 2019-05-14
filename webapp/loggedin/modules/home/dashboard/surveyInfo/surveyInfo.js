import './surveyInfo.scss'

import React, { useState, useContext } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import AppContext from '../../../../../app/appContext'

import DeleteSurveyDialog from './deleteSurveyDialog'
import ErrorBadge from '../../../../../commonComponents/errorBadge'

import Survey from '../../../../../../common/survey/survey'
import AuthManager from '../../../../../../common/auth/authManager'
import Validator from '../../../../../../common/validation/validator'

import * as AppState from '../../../../../app/appState'
import * as SurveyState from '../../../../../survey/surveyState'

import { appModuleUri } from '../../../../appModules'
import { designerModules } from '../../../designer/designerModules'
import { homeModules } from '../../homeModules'

import { deleteSurvey, publishSurvey } from '../../../../../survey/actions'

const SurveyInfo = props => {

  const {
    surveyInfo, canEditDef,
    publishSurvey, deleteSurvey
  } = props

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { i18n } = useContext(AppContext)
  const lang = Survey.getLanguage(i18n.lang)(surveyInfo)

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
                      onClick={() => window.confirm(i18n.t('homeView.surveyInfo.confirmPublish'))
                        ? publishSurvey()
                        : null}>
                <span className="icon icon-checkmark2 icon-12px icon-left"/> {i18n.t('homeView.surveyInfo.publish')}
              </button>
            }
          </div>

          <Link to={appModuleUri(homeModules.surveyInfo)} className="btn btn-of-light">
            <span className={`icon icon-${canEditDef ? 'pencil2' : 'eye'} icon-12px icon-left`}/>
            {canEditDef ? 'Edit' : 'View'} {i18n.t('homeView.surveyInfo.info')}
          </Link>

          {
            canEditDef &&
            <button className="btn btn-of-light" onClick={() => setShowDeleteDialog(true)}>
              <span className="icon icon-bin icon-12px icon-left"/> {i18n.t('common.delete')}
            </button>
          }
          {
            Survey.isFromCollect(surveyInfo) && Survey.hasCollectReportIssues(surveyInfo) &&
            <Link to={appModuleUri(homeModules.collectImportReport)}
                  className="btn btn-of-light">
              <span className="icon icon-warning icon-12px icon-left"/>
              {i18n.t('homeView.surveyInfo.collectImportReport')}
            </Link>
          }
        </div>

        <div className="hr"/>

        <div className="row">
          <Link
            to={appModuleUri(designerModules.formDesigner)} className="btn btn btn-of-light">
            <span className="icon icon-quill icon-12px icon-left"/> {i18n.t('homeView.surveyInfo.formDesigner')}
          </Link>
          <Link
            to={appModuleUri(designerModules.surveyHierarchy)} className="btn btn btn-of-light">
            <span className="icon icon-tree icon-12px icon-left"/> {i18n.t('homeView.surveyInfo.hierarchy')}
          </Link>
          <Link
            to={appModuleUri(designerModules.categories)} className="btn btn btn-of-light">
            <span className="icon icon-list2 icon-12px icon-left"/> {i18n.t('homeView.surveyInfo.categories')}
          </Link>
          <Link
            to={appModuleUri(designerModules.taxonomies)} className="btn btn btn-of-light">
            <span className="icon icon-leaf icon-12px icon-left"/> {i18n.t('homeView.surveyInfo.taxonomies')}
          </Link>
        </div>

      </div>

      {
        showDeleteDialog &&
        <DeleteSurveyDialog
          onCancel={() => setShowDeleteDialog(false)}
          onDelete={() => deleteSurvey()}
          surveyName={Survey.getName(surveyInfo)}/>
      }
    </div>
  )

}

const mapStateToProps = state => {
  const user = AppState.getUser(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)

  return {
    surveyInfo,
    canEditDef: AuthManager.canEditSurvey(user, surveyInfo),
  }
}

export default connect(
  mapStateToProps,
  { publishSurvey, deleteSurvey }
)(SurveyInfo)