import './designerView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import useI18n from '../../../commonComponents/useI18n'

import AuthManager from '../../../../common/auth/authManager'

import SurveyDefsLoader from '../../surveyViews/surveyDefsLoader/surveyDefsLoader'
import NavigationTabBar from '../components/moduleNavigationTabBar'
import SurveyFormView from '../../surveyViews/surveyForm/surveyFormView'
import SurveyHierarchy from './surveyHierarchy/surveyHierarchy'
import RecordView from '../data/records/components/recordView'
import CategoriesView from '../../surveyViews/categories/categoriesView'
import TaxonomiesView from '../../surveyViews/taxonomies/taxonomiesView'

import { appModules, appModuleUri, designerModules } from '../../appModules'

import * as AppState from '../../../app/appState'
import * as SurveyState from '../../../survey/surveyState'

import { resetForm } from '../../surveyViews/surveyForm/actions'

const DesignerView = ({ canEditDef, resetForm }) => {

  const i18n = useI18n()

  useEffect(() => { resetForm() }, [])

  return (
    <SurveyDefsLoader
      draft={canEditDef}
      validate={canEditDef}>

      <NavigationTabBar
        className="designer app-module__tab-navigation"
        moduleRoot={appModules.designer}
        moduleDefault={designerModules.formDesigner}
        tabs={[
          {
            label: i18n.t('appModules.formDesigner'),
            component: SurveyFormView,
            path: appModuleUri(designerModules.formDesigner),
            props: { edit: true, draft: true, canEditDef },
          },

          {
            label: i18n.t('appModules.surveyHierarchy'),
            component: SurveyHierarchy,
            path: appModuleUri(designerModules.surveyHierarchy),
          },

          {
            label: i18n.t('designerView.formPreview'),
            component: RecordView,
            path: `${appModuleUri(designerModules.recordPreview)}:recordUuid`,
            props: { edit: true, draft: true, canEditDef, preview: true },
            showTab: false,
          },

          {
            label: i18n.t('appModules.categories'),
            component: CategoriesView,
            path: appModuleUri(designerModules.categories),
          },

          {
            label: i18n.t('appModules.taxonomies'),
            component: TaxonomiesView,
            path: appModuleUri(designerModules.taxonomies),
          },

        ]}
      />
    </SurveyDefsLoader>
  )
}

const mapStateToProps = state => {
  const user = AppState.getUser(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)

  return {
    canEditDef: AuthManager.canEditSurvey(user, surveyInfo),
  }
}

export default connect(
  mapStateToProps,
  { resetForm }
)(DesignerView)
