import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import ModuleSwitch from '@webapp/components/moduleSwitch'
import NodeDefDetails from '@webapp/components/survey/NodeDefDetails'

import TaxonomyList from '@webapp/components/survey/TaxonomyList'
import TaxonomyDetails from '@webapp/components/survey/TaxonomyDetails'

import CategoryList from '@webapp/views/App/views/Designer/CategoryList'

import CategoryView from '@webapp/loggedin/surveyViews/category/categoryView'

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
            component: NodeDefDetails,
            path: appModuleUri(designerModules.nodeDef),
          },

          {
            component: NodeDefDetails,
            path: `${appModuleUri(designerModules.nodeDef)}:nodeDefUuid/`,
          },

          {
            component: SurveyHierarchy,
            path: appModuleUri(designerModules.surveyHierarchy),
          },

          {
            component: CategoryList,
            path: appModuleUri(designerModules.categories),
          },

          {
            component: CategoryView,
            path: `${appModuleUri(designerModules.category)}:categoryUuid`,
          },

          {
            component: TaxonomyList,
            path: appModuleUri(designerModules.taxonomies),
          },
          {
            component: TaxonomyDetails,
            path: `${appModuleUri(designerModules.taxonomy)}`,
          },
          {
            component: TaxonomyDetails,
            path: `${appModuleUri(designerModules.taxonomy)}:taxonomyUuid`,
          },
        ]}
      />
    </SurveyDefsLoader>
  )
}

export default Designer
