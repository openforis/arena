import React from 'react'
import { useNavigate } from 'react-router'

import { appModules, appModuleUri, analysisModules } from '@webapp/app/appModules'

import ModuleSwitch from '@webapp/components/moduleSwitch'
import CategoryDetails from '@webapp/components/survey/CategoryDetails'
import NodeDefDetails from '@webapp/components/survey/NodeDefDetails'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'

import Chains from './Chains'
import Chain from './Chain'
import Instances from './Instances'
// import Entities from './Entities'

const Analysis = () => {
  const navigate = useNavigate()
  return (
    <SurveyDefsLoader draft requirePublish onSurveyCycleUpdate={() => navigate(appModuleUri(analysisModules.chains))}>
      <ModuleSwitch
        moduleRoot={appModules.analysis}
        moduleDefault={analysisModules.chains}
        modules={[
          {
            component: Chains,
            path: analysisModules.chains.path,
          },
          {
            component: Chain,
            path: analysisModules.chain.path,
          },
          {
            component: Chain,
            path: `${analysisModules.chain.path}/:chainUuid/`,
          },
          // {
          //   component: Entities,
          //   path: appModuleUri(analysisModules.entities),
          // },
          {
            component: NodeDefDetails,
            path: `${analysisModules.nodeDef.path}/:nodeDefUuid/`,
          },
          {
            component: CategoryDetails,
            path: `${analysisModules.category.path}/:categoryUuid`,
            props: { analysis: true },
          },
          {
            component: Instances,
            path: analysisModules.instances.path,
          },
        ]}
      />
    </SurveyDefsLoader>
  )
}

export default Analysis
