import React from 'react'

import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import ModuleSwitch from '@webapp/components/moduleSwitch'
import NodeDefDetails from '@webapp/components/survey/NodeDefDetails'

import TaxonomyList from '@webapp/components/survey/TaxonomyList'
import TaxonomyDetails from '@webapp/components/survey/TaxonomyDetails'

import CategoryList from '@webapp/components/survey/CategoryList'
import CategoryDetails from '@webapp/components/survey/CategoryDetails'

import { appModules, appModuleUri, designerModules } from '@webapp/app/appModules'
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
            component: CategoryDetails,
            path: `${appModuleUri(designerModules.category)}`,
          },

          {
            component: CategoryDetails,
            path: `${appModuleUri(designerModules.category)}:categoryUuid`,
          },

          {
            component: TaxonomyList,
            path: appModuleUri(designerModules.taxonomies),
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
