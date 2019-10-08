import React from 'react'

import { appModules, appModuleUri, analysisModules } from '../../appModules'

import InnerModuleSwitch from '../components/innerModuleSwitch'
import ProcessingChainsView from './processingChains/processingChainsView'

const AnalysisView = () => (
  <InnerModuleSwitch
    moduleRoot={appModules.analysis}
    moduleDefault={analysisModules.processingChains}
    modules={[
      {
        component: ProcessingChainsView,
        path: appModuleUri(analysisModules.processingChains),
      },
    ]}
  />
)

export default AnalysisView
