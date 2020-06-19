import React from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import { appModules, appModuleUri, analysisModules } from '@webapp/app/appModules'

import ModuleSwitch from '@webapp/components/moduleSwitch'
import CategoriesView from '@webapp/loggedin/surveyViews/categories/categoriesView'
import CategoryView from '@webapp/loggedin/surveyViews/category/categoryView'
import NodeDefView from '@webapp/loggedin/surveyViews/nodeDef/nodeDefView'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import ChainView from '@webapp/loggedin/modules/analysis/chain/view'

import { navigateToChainsView } from '@webapp/loggedin/modules/analysis/chain/actions'

import Chains from './Chains'

const Analysis = () => {
  const dispatch = useDispatch()
  const history = useHistory()
  return (
    <SurveyDefsLoader
      draft
      validate={false}
      requirePublish
      onSurveyCycleUpdate={() => dispatch(navigateToChainsView(history))}
    >
      <ModuleSwitch
        moduleRoot={appModules.analysis}
        moduleDefault={analysisModules.processingChains}
        modules={[
          {
            component: Chains,
            path: appModuleUri(analysisModules.processingChains),
          },
          {
            component: ChainView,
            path: `${appModuleUri(analysisModules.processingChain)}:chainUuid/`,
          },
          {
            component: NodeDefView,
            path: `${appModuleUri(analysisModules.nodeDef)}:nodeDefUuid/`,
          },
          {
            component: CategoriesView,
            path: appModuleUri(analysisModules.categories),
            props: { analysis: true },
          },
          {
            component: CategoryView,
            path: `${appModuleUri(analysisModules.category)}:categoryUuid`,
            props: { analysis: true },
          },
        ]}
      />
    </SurveyDefsLoader>
  )
}

export default Analysis
