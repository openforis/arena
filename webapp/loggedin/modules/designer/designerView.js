import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import * as Authorizer from '@core/auth/authorizer'

import SurveyDefsLoader from '@webapp/loggedin/surveyViews/surveyDefsLoader/surveyDefsLoader'
import InnerModuleSwitch from '@webapp/loggedin/modules/components/innerModuleSwitch'
import FormDesignerView from './formDesigner/formDesignerView'
import NodeDefView from '@webapp/loggedin/surveyViews/nodeDef/nodeDefView'
import CategoriesView from '@webapp/loggedin/surveyViews/categories/categoriesView'
import CategoryView from '@webapp/loggedin/surveyViews/category/categoryView'
import TaxonomiesView from '@webapp/loggedin/surveyViews/taxonomies/taxonomiesView'
import TaxonomyView from '@webapp/loggedin/surveyViews/taxonomy/taxonomyView'
import SurveyHierarchyView from './surveyHierarchy/surveyHierarchyView'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'
import { appModules, appModuleUri, designerModules } from '../../appModules'

import { resetForm } from '../../surveyViews/surveyForm/actions'

const DesignerView = ({ canEditDef, resetForm }) => {
  useEffect(() => {
    resetForm()
  }, [])

  return (
    <SurveyDefsLoader draft={canEditDef} validate={canEditDef}>
      <InnerModuleSwitch
        moduleRoot={appModules.designer}
        moduleDefault={designerModules.formDesigner}
        modules={[
          {
            component: FormDesignerView,
            path: appModuleUri(designerModules.formDesigner),
          },

          {
            component: NodeDefView,
            path: appModuleUri(designerModules.nodeDef),
          },

          {
            component: NodeDefView,
            path: `${appModuleUri(designerModules.nodeDef)}:nodeDefUuid/`,
          },

          {
            component: SurveyHierarchyView,
            path: appModuleUri(designerModules.surveyHierarchy),
          },

          {
            component: CategoriesView,
            path: appModuleUri(designerModules.categories),
          },

          {
            component: CategoryView,
            path: `${appModuleUri(designerModules.category)}:categoryUuid`,
          },

          {
            component: TaxonomiesView,
            path: appModuleUri(designerModules.taxonomies),
          },

          {
            component: TaxonomyView,
            path: `${appModuleUri(designerModules.taxonomy)}:taxonomyUuid`,
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

export default connect(mapStateToProps, { resetForm })(DesignerView)
