import React from 'react'

import { appModules, appModuleUri, analysisModules } from '../../appModules'

import InnerModuleSwitch from '../components/innerModuleSwitch'
import ProcessingChainsListView from './processingChainsList/processingChainsListView'

const AnalysisView = () => (
  <InnerModuleSwitch
    moduleRoot={appModules.analysis}
    moduleDefault={analysisModules.processingChains}
    modules={[
      {
        component: ProcessingChainsListView,
        path: appModuleUri(analysisModules.processingChains),
      },
    ]}
  />
)

export default AnalysisView
