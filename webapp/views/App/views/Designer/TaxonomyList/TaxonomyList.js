// import './TaxonomyList.scss'

import React from 'react'
// import { useHistory } from 'react-router-dom'

// import * as User from '@core/user/user'
// import { appModuleUri, userModules } from '@webapp/app/appModules'

import Table from '@webapp/components/Table/Table'

import HeaderLeft from './HeaderLeft'
import RowHeader from './RowHeader'
import Row from './Row'

const TaxonomyList = () => {
  // const history = useHistory()
  // const onRowClick = (user) => history.push(`${appModuleUri(userModules.user)}${User.getUuid(user)}`)
  const onRowClick = () => ({})

  return (
    <Table
      module="taxonomies"
      className="taxonomies-list"
      gridTemplateColumns="repeat(2, 1fr) 10rem 10rem"
      headerLeftComponent={HeaderLeft}
      rowHeaderComponent={RowHeader}
      rowComponent={Row}
      onRowClick={onRowClick}
    />
  )
}

export default TaxonomyList
