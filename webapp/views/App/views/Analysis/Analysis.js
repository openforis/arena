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
            path: appModuleUri(analysisModules.chains),
          },
          {
            component: Chain,
            path: `${appModuleUri(analysisModules.chain)}`,
          },
          {
            component: Chain,
            path: `${appModuleUri(analysisModules.chain)}:chainUuid/`,
          },
          // {
          //   component: Entities,
          //   path: appModuleUri(analysisModules.entities),
          // },
          {
            component: NodeDefDetails,
            path: `${appModuleUri(analysisModules.nodeDef)}:nodeDefUuid/`,
          },
          {
            component: CategoryDetails,
            path: `${appModuleUri(analysisModules.category)}:categoryUuid`,
            props: { analysis: true },
          },
          {
            component: Instances,
            path: `${appModuleUri(analysisModules.instances)}`,
          },
        ]}
      />
    </SurveyDefsLoader>
  )
}

export default Analysis
