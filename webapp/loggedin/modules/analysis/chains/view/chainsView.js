import './chainsView.scss'
import React from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as Chain from '@common/analysis/processingChain'

import { useSurveyCycleKey } from '@webapp/commonComponents/hooks'
import TableView from '@webapp/loggedin/tableViews/tableView'

import { navigateToChainView } from '@webapp/loggedin/modules/analysis/chains/actions'

import Row from './components/row'
import RowHeader from './components/rowHeader'
import HeaderLeft from './components/headerLeft'

const chainsModule = 'processing-chains'

const ChainsView = () => {
  const history = useHistory()
  const dispatch = useDispatch()
  const surveyCycleKey = useSurveyCycleKey()

  return (
    <TableView
      className="chains"
      gridTemplateColumns="repeat(4, 1fr) repeat(2, 80px) 50px"
      headerLeftComponent={HeaderLeft}
      module={chainsModule}
      onRowClick={(processingChain) => dispatch(navigateToChainView(history, Chain.getUuid(processingChain)))}
      reloadOnSurveyCycleUpdate
      restParams={{ surveyCycleKey }}
      rowHeaderComponent={RowHeader}
      rowComponent={Row}
    />
  )
}

export default ChainsView
