import React from 'react'
import { useHistory } from 'react-router'

import Table from '@webapp/components/Table'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'

import Row from './Row'
import RowHeader from './RowHeader'
import HeaderLeft from './HeaderLeft'

const ChainsView = () => {
  const history = useHistory()

  const onRowClick = (nodeDef) => history.push(`${appModuleUri(analysisModules.nodeDef)}${nodeDef.uuid}`)

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
