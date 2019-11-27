import './processingChainsView.scss'

import React from 'react'
import {connect} from 'react-redux'

import * as ProcessingChain from '@common/analysis/processingChain'

import {useOnUpdate} from '@webapp/commonComponents/hooks'

import * as SurveyState from '@webapp/survey/surveyState'
import TableView from '../../../tableViews/tableView'

import {reloadListItems} from '../../../tableViews/actions'
import ProcessingChainsRow from './components/processingChainsRow'
import ProcessingChainsRowHeader from './components/processingChainsRowHeader'
import ProcessingChainsHeaderLeft from './components/processingChainsHeaderLeft'

import {createProcessingChain, navigateToProcessingChainView} from './actions'

const processingChainsModule = 'processing-chains'

const ProcessingChainsView = props => {
  const {
    surveyCycleKey,
    history,
    reloadListItems, createProcessingChain, navigateToProcessingChainView
  } = props

  const restParams = {surveyCycleKey}

  useOnUpdate(() => {
    reloadListItems(processingChainsModule, restParams)
  }, [surveyCycleKey])

  return (
    <TableView
      module={processingChainsModule}
      restParams={restParams}
      className="processing-chains"
      gridTemplateColumns={'repeat(3, 1fr) repeat(2, 80px)'}
      rowHeaderComponent={ProcessingChainsRowHeader}
      headerLeftComponent={ProcessingChainsHeaderLeft}
      rowComponent={ProcessingChainsRow}
      onRowClick={processingChain => navigateToProcessingChainView(history, ProcessingChain.getUuid(processingChain))}

      history={history}
      createProcessingChain={createProcessingChain}
    />
  )
}

const mapStateToProps = state => ({
  surveyCycleKey: SurveyState.getSurveyCycleKey(state),
})

export default connect(
  mapStateToProps,
  {
    reloadListItems,
    createProcessingChain,
    navigateToProcessingChainView
  }
)(ProcessingChainsView)
