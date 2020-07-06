import React from 'react'
import { useHistory } from 'react-router'

import { appModules, appModuleUri, analysisModules } from '@webapp/app/appModules'

import ModuleSwitch from '@webapp/components/moduleSwitch'
import CategoryView from '@webapp/loggedin/surveyViews/category/categoryView'
import NodeDefDetails from '@webapp/components/survey/NodeDefDetails'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'

import Chains from './Chains'
import Chain from './Chain'

const Analysis = () => {
  const history = useHistory()
  return (
    <SurveyDefsLoader
      draft
      validate={false}
      requirePublish
      onSurveyCycleUpdate={() => history.push(appModuleUri(analysisModules.processingChains))}
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
            component: Chain,
            path: `${appModuleUri(analysisModules.processingChain)}`,
          },
          {
            component: Chain,
            path: `${appModuleUri(analysisModules.processingChain)}:chainUuid/`,
          },
          {
            component: NodeDefDetails,
            path: `${appModuleUri(analysisModules.nodeDef)}:nodeDefUuid/`,
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
