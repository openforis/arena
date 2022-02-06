import React from 'react'

import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import ModuleSwitch from '@webapp/components/moduleSwitch'
import NodeDefDetails from '@webapp/components/survey/NodeDefDetails'

import TaxonomyList from '@webapp/components/survey/TaxonomyList'
import TaxonomyDetails from '@webapp/components/survey/TaxonomyDetails'

import CategoryList from '@webapp/components/survey/CategoryList'
import CategoryDetails from '@webapp/components/survey/CategoryDetails'

import { appModules, designerModules } from '@webapp/app/appModules'
import { useAuthCanEditSurvey, useAuthCanUseAnalysis } from '@webapp/store/user'

import FormDesigner from './FormDesigner'
import SurveyHierarchy from './SurveyHierarchy'

const Designer = () => {
  const canEditSurvey = useAuthCanEditSurvey()
  const canAnalyzeRecords = useAuthCanUseAnalysis()

  return (
    <SurveyDefsLoader draft={canEditSurvey} validate={canEditSurvey}>
      <ModuleSwitch
        moduleRoot={appModules.designer}
        moduleDefault={designerModules.formDesigner}
        modules={[
          ...(canEditSurvey
            ? [
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
              ]
            : []),
          {
            component: SurveyHierarchy,
            path: designerModules.surveyHierarchy.path,
          },
          ...(canAnalyzeRecords
            ? [
                // Category
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
                // Taxonomy
                {
                  component: TaxonomyList,
                  path: designerModules.taxonomies.path,
                },
                {
                  component: TaxonomyDetails,
                  path: `${designerModules.taxonomy.path}/:taxonomyUuid`,
                },
              ]
            : []),
        ]}
      />
    </SurveyDefsLoader>
  )
}

export default Designer
