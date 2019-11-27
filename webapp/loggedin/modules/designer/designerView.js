import React, {useEffect} from 'react'
import {connect} from 'react-redux'

import * as Authorizer from '@core/auth/authorizer'

import SurveyDefsLoader from '@webapp/loggedin/surveyViews/surveyDefsLoader/surveyDefsLoader'
import CategoriesView from '@webapp/loggedin/surveyViews/categories/categoriesView'
import TaxonomiesView from '@webapp/loggedin/surveyViews/taxonomies/taxonomiesView'
import InnerModuleSwitch from '@webapp/loggedin/modules/components/innerModuleSwitch'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'
import {appModules, appModuleUri, designerModules} from '../../appModules'

import {resetForm} from '../../surveyViews/surveyForm/actions'
import SurveyHierarchy from './surveyHierarchy/surveyHierarchy'
import FormDesignerView from './formDesigner/formDesignerView'

const DesignerView = ({canEditDef, resetForm}) => {
  useEffect(() => {
    resetForm()
  }, [])

  return (
    <SurveyDefsLoader
      draft={canEditDef}
      validate={canEditDef}>

      <InnerModuleSwitch
        moduleRoot={appModules.designer}
        moduleDefault={designerModules.formDesigner}
        modules={[
          {
            component: FormDesignerView,
            path: appModuleUri(designerModules.formDesigner),
          },

          {
            component: SurveyHierarchy,
            path: appModuleUri(designerModules.surveyHierarchy),
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
    canEditDef: Authorizer.canEditSurvey(user, surveyInfo),
  }
}

export default connect(mapStateToProps, {resetForm})(DesignerView)
