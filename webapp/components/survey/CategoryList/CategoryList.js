import React from 'react'
import PropTypes from 'prop-types'

import Table from '@webapp/components/Table'

import { useAuthCanEditSurvey } from '@webapp/store/user'

import TableRow from './TableRow'
import TableRowHeader from './TableRowHeader'
import TableHeaderLeft from './TableHeaderLeft'

import { useLocalState } from './store'

const CategoryList = (props) => {
  const { canSelect, onAdd, onEdit, onSelect, selectedItemUuid } = props

  const { state, setState } = useLocalState({ canSelect, onAdd, onEdit, onSelect, selectedItemUuid })

  const canEdit = useAuthCanEditSurvey()

  const gridTemplateColumns = [
    '50px', // index
    '1fr', // name
    ...(canEdit ? ['repeat(2, 80px)'] : []), // error and warning badges
    ...(canSelect ? ['80px'] : []), // select button
    ...(canEdit ? ['repeat(2, 75px)'] : []), // edit and delete buttons
  ].join(' ')

  return (
    <>
      <Table
        module="categories"
        restParams={{ draft: canEdit, validate: canEdit }}
        gridTemplateColumns={gridTemplateColumns}
        headerLeftComponent={TableHeaderLeft}
        rowHeaderComponent={TableRowHeader}
        rowComponent={TableRow}
        headerProps={{ state }}
        rowProps={{ state, setState }}
      />
    </>
  )
}

CategoryList.propTypes = {
  canSelect: PropTypes.bool,
  onAdd: PropTypes.func,
  onEdit: PropTypes.func,
  onSelect: PropTypes.func,
  selectedItemUuid: PropTypes.string,
}

CategoryList.defaultProps = {
  canSelect: false,
  onAdd: null,
  onEdit: null,
  onSelect: null,
  selectedItemUuid: null,
}

export default CategoryList
