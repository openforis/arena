import './surveyInfo.scss'

import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import useI18n from '../../../../../commonComponents/useI18n'

import DeleteSurveyDialog from './deleteSurveyDialog'

import Survey from '../../../../../../common/survey/survey'
import Authorizer from '../../../../../../common/auth/authorizer'

import * as AppState from '../../../../../app/appState'
import * as SurveyState from '../../../../../survey/surveyState'

import { appModuleUri, designerModules, homeModules } from '../../../../appModules'

import { deleteSurvey, publishSurvey } from '../../../../../survey/actions'

const SurveyInfo = props => {

  const {
    surveyInfo, canEditDef,
    publishSurvey, deleteSurvey
  } = props

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const i18n = useI18n()
  const lang = Survey.getLanguage(i18n.lang)(surveyInfo)

  return Survey.isValid(surveyInfo)
    ? (
      <div className="home-dashboard__survey-info">

        <div className="home-dashboard__survey-info-container">

          <div className="row">
            <h4 className="survey-name">
              {Survey.getLabel(surveyInfo, lang)}
            </h4>

            <div className="survey-status">
              {
                Survey.isDraft(surveyInfo) &&
                <span className="icon icon-warning icon-14px icon-left"/>
              }

              {Survey.getStatus(surveyInfo)}

              {
                canEditDef &&
                <button className="btn"
                        aria-disabled={!Survey.isDraft(surveyInfo)}
                        onClick={() => window.confirm(i18n.t('homeView.surveyInfo.confirmPublish'))
                          ? publishSurvey()
                          : null}>
                  <span className="icon icon-checkmark2 icon-12px icon-left"/> {i18n.t('homeView.surveyInfo.publish')}
                </button>
              }
            </div>

            <Link to={appModuleUri(homeModules.surveyInfo)} className="btn">
              <span className={`icon icon-${canEditDef ? 'pencil2' : 'eye'} icon-12px icon-left`}/>
              {i18n.t(canEditDef ? 'homeView.surveyInfo.editInfo' : 'homeView.surveyInfo.viewInfo')}
            </Link>

            {
              canEditDef &&
              <button className="btn" onClick={() => setShowDeleteDialog(true)}>
                <span className="icon icon-bin icon-12px icon-left"/> {i18n.t('common.delete')}
              </button>
            }
            {
              Survey.isFromCollect(surveyInfo) && Survey.hasCollectReportIssues(surveyInfo) &&
              <Link to={appModuleUri(homeModules.collectImportReport)}
                    className="btn">
                <span className="icon icon-warning icon-12px icon-left"/>
                {i18n.t('appModules.collectImportReport')}
              </Link>
            }
          </div>

          <div className="hr"/>

          <div className="row">
            <Link
              to={appModuleUri(designerModules.formDesigner)} className="btn">
              <span className="icon icon-quill icon-12px icon-left"/>
              {i18n.t('appModules.formDesigner')}
            </Link>
            <Link
              to={appModuleUri(designerModules.surveyHierarchy)} className="btn">
              <span className="icon icon-tree icon-12px icon-left"/>
              {i18n.t('appModules.surveyHierarchy')}
            </Link>
            <Link
              to={appModuleUri(designerModules.categories)} className="btn">
              <span className="icon icon-list2 icon-12px icon-left"/>
              {i18n.t('appModules.categories')}
            </Link>
            <Link
              to={appModuleUri(designerModules.taxonomies)} className="btn">
              <span className="icon icon-leaf icon-12px icon-left"/>
              {i18n.t('appModules.taxonomies')}
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
    : null
}

const mapStateToProps = state => {
  const user = AppState.getUser(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)

  return {
    surveyInfo,
    canEditDef: Authorizer.canEditSurvey(user, surveyInfo),
  }
}

export default connect(
  mapStateToProps,
  { publishSurvey, deleteSurvey }
)(SurveyInfo)