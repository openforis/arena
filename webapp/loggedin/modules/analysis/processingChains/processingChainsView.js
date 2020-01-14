import './processingChainsView.scss'

import React from 'react'
import { connect } from 'react-redux'
import { useHistory } from 'react-router'

import { useOnUpdate } from '@webapp/commonComponents/hooks'
import * as ProcessingChain from '@common/analysis/processingChain'

import TableView from '@webapp/loggedin/tableViews/tableView'

import ProcessingChainsRow from './components/processingChainsRow'
import ProcessingChainsRowHeader from './components/processingChainsRowHeader'
import ProcessingChainsHeaderLeft from './components/processingChainsHeaderLeft'

import * as SurveyState from '@webapp/survey/surveyState'

import { createProcessingChain, fetchProcessingChain } from './actions'
import { reloadListItems } from '@webapp/loggedin/tableViews/actions'

const processingChainsModule = 'processing-chains'

const ProcessingChainsView = props => {
  const { surveyCycleKey, reloadListItems, createProcessingChain, fetchProcessingChain } = props

  const restParams = { surveyCycleKey }

  const history = useHistory()

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
      onRowClick={processingChain => fetchProcessingChain(history, ProcessingChain.getUuid(processingChain))}
      history={history}
      createProcessingChain={createProcessingChain}
    />
  )
}

const mapStateToProps = state => ({
  surveyCycleKey: SurveyState.getSurveyCycleKey(state),
})

export default connect(mapStateToProps, {
  reloadListItems,
  createProcessingChain,
  fetchProcessingChain,
})(ProcessingChainsView)
