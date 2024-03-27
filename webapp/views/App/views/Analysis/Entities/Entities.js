import React from 'react'
import { useNavigate } from 'react-router'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import Table from '@webapp/components/Table'

import HeaderLeft from './HeaderLeft'
import Row from './Row'
import RowHeader from './RowHeader'

const ChainsView = () => {
  const navigate = useNavigate()

  const onRowClick = (nodeDef) => navigate(`${appModuleUri(analysisModules.nodeDef)}${nodeDef.uuid}`)

  return (
    <Table
      className="entities"
      gridTemplateColumns="30px repeat(3, 1fr) 50px"
      headerLeftComponent={HeaderLeft}
      module="virtual-entities"
      onRowClick={onRowClick}
      restParams={{}}
      rowHeaderComponent={RowHeader}
      rowComponent={Row}
    />
  )
}

export default ChainsView
