import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import ModuleSwitch from '@webapp/components/moduleSwitch'
import NodeDefEdit from '@webapp/views/App/views/NodeDef/NodeDefEdit'
import CategoriesView from '@webapp/loggedin/surveyViews/categories/categoriesView'
import CategoryView from '@webapp/loggedin/surveyViews/category/categoryView'
import TaxonomiesView from '@webapp/loggedin/surveyViews/taxonomies/taxonomiesView'
import TaxonomyView from '@webapp/loggedin/surveyViews/taxonomy/taxonomyView'

import { appModules, appModuleUri, designerModules } from '@webapp/app/appModules'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import { resetForm } from '@webapp/loggedin/surveyViews/surveyForm/actions'

import FormDesigner from './FormDesigner'
import SurveyHierarchy from './SurveyHierarchy'

const Designer = () => {
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
            component: FormDesigner,
            path: appModuleUri(designerModules.formDesigner),
          },

          {
            component: NodeDefEdit,
            path: appModuleUri(designerModules.nodeDef),
          },

          {
            component: NodeDefEdit,
            path: `${appModuleUri(designerModules.nodeDef)}:nodeDefUuid/`,
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

export default Designer
