import React from 'react'
import PropTypes from 'prop-types'
import { matchPath, useLocation } from 'react-router'

import Table from '@webapp/components/Table'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import { useAuthCanEditSurvey } from '@webapp/store/user'

import TableRow from './TableRow'
import TableRowHeader from './TableRowHeader'
import TableHeaderLeft from './TableHeaderLeft'

const CategoryList = (props) => {
  const { canSelect, onSelect, selectedItemUuid } = props

  const { pathname } = useLocation()

  const inCategoriesPath = Boolean(matchPath(pathname, appModuleUri(designerModules.categories)))

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
        headerProps={{ inCategoriesPath, canSelect, onSelect }}
        rowProps={{ inCategoriesPath, canSelect, onSelect, selectedItemUuid }}
      />
    </>
  )
}

CategoryList.propTypes = {
  canSelect: PropTypes.bool,
  onSelect: PropTypes.func,
  selectedItemUuid: PropTypes.string,
}

CategoryList.defaultProps = {
  canSelect: false,
  onSelect: null,
  selectedItemUuid: null,
}

export default CategoryList
