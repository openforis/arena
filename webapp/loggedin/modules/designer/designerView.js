import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import SurveyDefsLoader from '@webapp/loggedin/surveyViews/surveyDefsLoader/surveyDefsLoader'
import ModuleSwitch from '@webapp/components/moduleSwitch'
import NodeDefView from '@webapp/loggedin/surveyViews/nodeDef/nodeDefView'
import CategoriesView from '@webapp/loggedin/surveyViews/categories/categoriesView'
import CategoryView from '@webapp/loggedin/surveyViews/category/categoryView'
import TaxonomiesView from '@webapp/loggedin/surveyViews/taxonomies/taxonomiesView'
import TaxonomyView from '@webapp/loggedin/surveyViews/taxonomy/taxonomyView'

import { appModules, appModuleUri, designerModules } from '@webapp/app/appModules'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import SurveyHierarchyView from './surveyHierarchy/surveyHierarchyView'
import FormDesignerView from './formDesigner/formDesignerView'

import { resetForm } from '../../surveyViews/surveyForm/actions'

const DesignerView = () => {
  const dispatch = useDispatch()
  const canEditDef = useAuthCanEditSurvey()

  useEffect(() => {
    dispatch(resetForm())
  }, [])

  return (
    <SurveyDefsLoader draft={canEditDef} validate={canEditDef}>
      <ModuleSwitch
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

export default DesignerView
