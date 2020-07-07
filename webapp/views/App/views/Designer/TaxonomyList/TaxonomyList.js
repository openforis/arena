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
      gridTemplateColumns="repeat(2, 1fr) repeat(3, 6rem)"
      headerLeftComponent={HeaderLeft}
      rowHeaderComponent={RowHeader}
      rowComponent={Row}
    />
  )
}

export default TaxonomyList
