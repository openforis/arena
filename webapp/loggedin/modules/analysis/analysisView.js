import React from 'react'

import { appModules, appModuleUri, analysisModules } from '@webapp/app/appModules'

import ModuleSwitch from '@webapp/commonComponents/moduleSwitch'
import SurveyDefsLoader from '../../surveyViews/surveyDefsLoader/surveyDefsLoader'
import ProcessingChainsView from './processingChains/processingChainsView'
import ProcessingChainView from './processingChain/processingChainView'
import ProcessingStepView from './processingStep/processingStepView'
import NodeDefAnalysisView from './nodeDefAnalysis/nodeDefAnalysisView'

const AnalysisView = () => (
  <SurveyDefsLoader draft={false} validate={false} requirePublish={true}>
    <ModuleSwitch
      moduleRoot={appModules.analysis}
      moduleDefault={analysisModules.processingChains}
      modules={[
        {
          component: ProcessingChainsView,
          path: appModuleUri(analysisModules.processingChains),
        },
        {
          component: ProcessingChainView,
          path: `${appModuleUri(analysisModules.processingChain)}:processingChainUuid/`,
        },
        {
          component: ProcessingStepView,
          path: `${appModuleUri(analysisModules.processingStep)}:processingStepUuid/`,
        },
        {
          component: NodeDefAnalysisView,
          path: `${appModuleUri(analysisModules.nodeDef)}:nodeDefUuid/`,
        },
      ]}
    />
  </SurveyDefsLoader>
)

export default AnalysisView
