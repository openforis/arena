import React from 'react'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as DateUtils from '@core/dateUtils'

import ProgressBar from '@webapp/commonComponents/progressBar'
import {useI18n} from '@webapp/commonComponents/hooks'

const statusComponent = {
  [ProcessingChain.statusExec.success]:
  <span className="icon icon-checkmark icon-14px"/>,
  [ProcessingChain.statusExec.error]:
  <span className="icon icon-cross icon-14px"/>,
  [ProcessingChain.statusExec.running]:
  <ProgressBar className="running progress-bar-striped" progress={100} showText={false}/>,
}

const ProcessingChainsRow = props => {
  const {row: processingChainsListItem} = props
  const i18n = useI18n()

  const statusExec = ProcessingChain.getStatusExec(processingChainsListItem)

  return (
    <>
      <div>
        {ProcessingChain.getLabel(i18n.lang)(processingChainsListItem)}
      </div>
      <div>
        {DateUtils.getRelativeDate(i18n, ProcessingChain.getDateModified(processingChainsListItem))}
      </div>
      <div>
        {DateUtils.getRelativeDate(i18n, ProcessingChain.getDateExecuted(processingChainsListItem))}
      </div>
      <div className="column-draft">
        {
          ProcessingChain.isDraft(processingChainsListItem) &&
          <span className="icon icon-wrench icon-14px"/>
        }
      </div>
      <div className={`column-status ${statusExec}`}>
        {statusComponent[statusExec]}
      </div>
    </>
  )
}

export default ProcessingChainsRow
