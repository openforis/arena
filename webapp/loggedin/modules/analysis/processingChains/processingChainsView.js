import './processingChainsView.scss'

import React from 'react'
import { connect } from 'react-redux'

import TableView from '../../../tableViews/tableView'

import ProcessingChainsRow from './components/processingChainsRow'
import ProcessingChainsRowHeader from './components/processingChainsRowHeader'

import { useOnUpdate } from '../../../../commonComponents/hooks'

import * as SurveyState from '../../../../survey/surveyState'

import { reloadListItems } from '../../../tableViews/actions'

const processingChainsModule = 'processing-chains'

const ProcessingChainsView = ({ surveyCycleKey, reloadListItems }) => {

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
    />
  )
}

const mapStateToProps = state => ({
  surveyCycleKey: SurveyState.getSurveyCycleKey(state),
})

export default connect(mapStateToProps, { reloadListItems })(ProcessingChainsView)
