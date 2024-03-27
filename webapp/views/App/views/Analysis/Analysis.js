import React from 'react'
import { useNavigate } from 'react-router'

import * as Survey from '@core/survey/survey'

import { analysisModules, appModules, appModuleUri } from '@webapp/app/appModules'
import ModuleSwitch from '@webapp/components/moduleSwitch'
import CategoryDetails from '@webapp/components/survey/CategoryDetails'
import NodeDefDetails from '@webapp/components/survey/NodeDefDetails'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import { useSurveyInfo } from '@webapp/store/survey'

import Chain from './Chain'
import Chains from './Chains'
import Instances from './Instances'
// import Entities from './Entities'

const Analysis = () => {
  const navigate = useNavigate()
  const surveyInfo = useSurveyInfo()
  return (
    <SurveyDefsLoader draft onSurveyCycleUpdate={() => navigate(appModuleUri(analysisModules.chains))}>
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

          ...(Survey.isPublished(surveyInfo)
            ? [
                {
                  component: Instances,
                  path: analysisModules.instances.path,
                },
              ]
            : []),
        ]}
      />
    </SurveyDefsLoader>
  )
}

export default Analysis
