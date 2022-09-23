import * as Chain from '@common/analysis/chain'
import { ChainStatisticalAnalysis } from '@common/analysis/chainStatisticalAnalysis'

import { print, setVar, source } from '../../rFunctions'
import RFileSystem from './rFileSystem'

export default class RFileStatisticalAnalysis extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'statistical-analysis')
  }

  async init() {
    if (
      Chain.hasSamplingDesign(this.rChain.chain) &&
      ChainStatisticalAnalysis.getEntityDefUuid(Chain.getStatisticalAnalysis(this.rChain.chain))
    ) {
      await super.init()

      await this.appendContent(
        source('https://raw.githubusercontent.com/openforis/r-arena/master/arena_survey_analysis.R'),
        setVar('arena_process_response', 'arenaAnalytics( )'),
        print('arena_process_response')
      )
    }
  }
}
