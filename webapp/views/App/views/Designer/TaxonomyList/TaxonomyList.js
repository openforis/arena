import React from 'react'

import Table from '@webapp/components/Table/Table'

import HeaderLeft from './HeaderLeft'
import RowHeader from './RowHeader'
import Row from './Row'

const TaxonomyList = () => {
  return (
    <Table
      module="taxonomies"
      className="taxonomies-list"
      gridTemplateColumns="repeat(4, 1fr) 10rem 10rem"
      headerLeftComponent={HeaderLeft}
      rowHeaderComponent={RowHeader}
      rowComponent={Row}
    />
  )
}

export default TaxonomyList
