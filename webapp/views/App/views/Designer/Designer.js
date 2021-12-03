import React from 'react'

import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import ModuleSwitch from '@webapp/components/moduleSwitch'
import NodeDefDetails from '@webapp/components/survey/NodeDefDetails'

import TaxonomyList from '@webapp/components/survey/TaxonomyList'
import TaxonomyDetails from '@webapp/components/survey/TaxonomyDetails'

import CategoryList from '@webapp/components/survey/CategoryList'
import CategoryDetails from '@webapp/components/survey/CategoryDetails'

import { appModules, designerModules } from '@webapp/app/appModules'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import FormDesigner from './FormDesigner'
import SurveyHierarchy from './SurveyHierarchy'

const Designer = () => {
  const canEditDef = useAuthCanEditSurvey()

  return (
    <SurveyDefsLoader draft={canEditDef} validate={canEditDef}>
      <ModuleSwitch
        moduleRoot={appModules.designer}
        moduleDefault={designerModules.formDesigner}
        modules={[
          {
            component: FormDesigner,
            path: designerModules.formDesigner.path,
          },

          {
            component: NodeDefDetails,
            path: designerModules.nodeDef.path,
          },

          {
            component: NodeDefDetails,
            path: `${designerModules.nodeDef.path}/:nodeDefUuid/`,
          },

          {
            component: SurveyHierarchy,
            path: designerModules.surveyHierarchy.path,
          },

          {
            component: CategoryList,
            path: designerModules.categories.path,
          },

          {
            component: CategoryDetails,
            path: designerModules.category.path,
          },

          {
            component: CategoryDetails,
            path: `${designerModules.category.path}/:categoryUuid`,
          },

          {
            component: TaxonomyList,
            path: designerModules.taxonomies.path,
          },

          {
            component: TaxonomyDetails,
            path: `${designerModules.taxonomy.path}/:taxonomyUuid`,
          },
        ]}
      />
    </SurveyDefsLoader>
  )
}

export default Designer
