import React, { useEffect } from 'react'
import { connect } from 'react-redux'

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

  useEffect(() => { resetForm() }, [])

  return (
    <SurveyDefsLoader
      draft={canEditDef}
      validate={canEditDef}>

      <NavigationTabBar
        moduleRoot={appModules.designer}
        moduleDefault={designerModules.formDesigner}
        modules={[
          {
            component: SurveyFormView,
            path: appModuleUri(designerModules.formDesigner),
            props: { edit: true, draft: true, canEditDef },
          },

          {
            component: SurveyHierarchy,
            path: appModuleUri(designerModules.surveyHierarchy),
          },

          {
            component: RecordView,
            path: `${appModuleUri(designerModules.recordPreview)}:recordUuid`,
            props: { edit: true, draft: true, canEditDef, preview: true },
          },

          {
            component: CategoriesView,
            path: appModuleUri(designerModules.categories),
          },

          {
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

export default connect(mapStateToProps, { resetForm })(DesignerView)
