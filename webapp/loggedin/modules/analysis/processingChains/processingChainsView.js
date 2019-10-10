import './processingChainsView.scss'

import React from 'react'
import { connect } from 'react-redux'

import ProcessingChain from '../../../../../common/analysis/processingChain'

import { useOnUpdate } from '../../../../commonComponents/hooks'

import TableView from '../../../tableViews/tableView'

import ProcessingChainsRow from './components/processingChainsRow'
import ProcessingChainsRowHeader from './components/processingChainsRowHeader'

import * as SurveyState from '../../../../survey/surveyState'

import { reloadListItems } from '../../../tableViews/actions'
import { appModuleUri, analysisModules } from '../../../appModules'

const processingChainsModule = 'processing-chains'

const ProcessingChainsView = ({ surveyCycleKey, reloadListItems, history }) => {

  const restParams = { cycle: surveyCycleKey }

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
      rowComponent={ProcessingChainsRow}
      onRowClick={processingChain => history.push(
        `${appModuleUri(analysisModules.processingChain)}${ProcessingChain.getUuid(processingChain)}`
      )}
    />
  )
}

const mapStateToProps = state => ({
  surveyCycleKey: SurveyState.getSurveyCycleKey(state),
})

export default connect(mapStateToProps, { reloadListItems })(ProcessingChainsView)
