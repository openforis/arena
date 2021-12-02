import './Chains.scss'
import React from 'react'
import { useNavigate } from 'react-router'

import * as Chain from '@common/analysis/chain'

import { useSurveyCycleKey } from '@webapp/store/survey'

import Table from '@webapp/components/Table'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'

import Row from './Row'
import RowHeader from './RowHeader'
import HeaderLeft from './HeaderLeft'

const ChainsView = () => {
  const navigate = useNavigate()
  const surveyCycleKey = useSurveyCycleKey()

  const onRowClick = (chain) => navigate(`${appModuleUri(analysisModules.chain)}${Chain.getUuid(chain)}`)

  return (
    <Table
      className="chains"
      gridTemplateColumns="30px repeat(4, 1fr) 50px"
      headerLeftComponent={HeaderLeft}
      module="processing-chains"
      onRowClick={onRowClick}
      restParams={{ surveyCycleKey }}
      rowHeaderComponent={RowHeader}
      rowComponent={Row}
    />
  )
}

export default ChainsView
