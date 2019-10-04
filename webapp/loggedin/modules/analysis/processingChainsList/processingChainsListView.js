import React from 'react'

import ProcessingChain from '../../../../../common/analysis/processingChain'
import DateUtils from '../../../../../common/dateUtils'

import { useI18n } from '../../../../commonComponents/hooks'

import { analysisModules } from '../../../appModules'

import TableView from '../../../tableViews/tableView'

const ProcessingChainsRowHeader = () => {
  const i18n = useI18n()
  return (
    <>
      <div/>
      <div>{i18n.t('common.label')}</div>
      <div>{i18n.t('common.dateModified')}</div>
      <div>{i18n.t('analysis.processingChain.dateExecuted')}</div>
      <div>{i18n.t('analysis.processingChain.status')}</div>
      </div>
    </>
  )
}

const ProcessingChainsRow = props => {
  const { row: processingChainsListItem } = props
  const i18n = useI18n()

  return (
    <>
      <div>
        {ProcessingChain.getLabel(i18n.lang)(processingChainsListItem)}
      </div>
      <div>
        {DateUtils.format(ProcessingChain.getDateModified(processingChainsListItem))}
      </div>
      <div>
        {DateUtils.format(ProcessingChain.getDateExecuted(processingChainsListItem))}
      </div>
      <div>
        {ProcessingChain.isDraft(processingChainsListItem) &&
        <span className="icon icon-wrench icon-16px"/>
        }
      </div>
      <div>
        {ProcessingChain.getStatusExec(processingChainsListItem)}
      </div>
    </>
  )
}

const ProcessingChainsListView = () =>
  <TableView
    module={analysisModules.processingChains.key}
    moduleApiUri={'/api/analysis/processingchains/list'}
    className="users-list"
    gridTemplateColumns={'1fr 80px 80px 20px 80px'}
    rowHeaderComponent={ProcessingChainsRowHeader}
    rowComponent={ProcessingChainsRow}
  />

export default ProcessingChainsListView