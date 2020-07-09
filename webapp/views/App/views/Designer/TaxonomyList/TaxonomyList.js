import React from 'react'
import PropTypes from 'prop-types'

import Table from '@webapp/components/Table/Table'

import HeaderLeft from './HeaderLeft'
import RowHeader from './RowHeader'
import Row from './Row'

const TaxonomyList = (props) => {
  const { canSelect, selectedItemUuid, onSelect: onSelectTaxonomy, onOpenTaxonomy, onTaxonomyCreated } = props

  return (
    <Table
      module="taxonomies"
      className="taxonomies-list"
      restParams={{ draft: true, validate: true }}
      gridTemplateColumns="repeat(2, 1fr) repeat(6, 7rem)"
      headerLeftComponent={HeaderLeft}
      rowHeaderComponent={RowHeader}
      rowComponent={Row}
      rowProps={{ canSelect, selectedItemUuid, onSelectTaxonomy, onOpenTaxonomy }}
      headerProps={{ onOpenTaxonomy, onTaxonomyCreated }}
    />
  )
}

TaxonomyList.propTypes = {
  canSelect: PropTypes.bool,
  onSelect: PropTypes.func,
  onOpenTaxonomy: PropTypes.func,
  onTaxonomyCreated: PropTypes.func,
  selectedItemUuid: PropTypes.string,
}

TaxonomyList.defaultProps = {
  canSelect: false,
  onSelect: null,
  onOpenTaxonomy: null,
  onTaxonomyCreated: null,
  selectedItemUuid: null,
}

export default TaxonomyList
