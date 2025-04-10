import * as Chain from '@common/analysis/chain'
import { ChainStatisticalAnalysis } from '@common/analysis/chainStatisticalAnalysis'

import { print, setVar, source } from '../../rFunctions'
import RFileSystem from './rFileSystem'
import * as ApiRoutes from '@common/apiRoutes'

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

      // Save OLAP files for statistical analysis
      const { chainUuid, surveyId, cycle, dirResults } = this.rChain
      const entityDefUuid = ChainStatisticalAnalysis.getEntityDefUuid(Chain.getStatisticalAnalysis(this.rChain.chain))

      // Check if OLAP files were generated
      await this.appendContent(`
        # Save OLAP files for statistical analysis
        olap_files <- list.files(pattern = "^OLAP_.*\\\\.csv$")
        if (length(olap_files) > 0) {
          for (olap_file in olap_files) {
            # Create zip file for each OLAP file
            olap_zip_file <- paste0("${dirResults}/", olap_file, ".zip")
            zipr(olap_zip_file, olap_file)
            
            # Send to server
            job <- arenaPutFile("${ApiRoutes.rChain.statisticalData({
              surveyId,
              cycle,
              chainUuid,
              entityUuid: entityDefUuid,
            })}", olap_zip_file)
            arenaWaitForJobToComplete(job)
          }
        }
      `)
    }
  }
}
