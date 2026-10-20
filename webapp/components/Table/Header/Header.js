import React from 'react'
import PropTypes from 'prop-types'

import { VisibleColumnsMenu } from './VisibleColumnsMenu'

const Header = (props) => {
  const {
    columns,
    count,
    headerLeftComponent,
    headerProps = {},
    limit,
    list,
    offset,
    onVisibleColumnsChange,
    totalCount,
    visibleColumnsSelectionEnabled = false,
    visibleColumnKeys,
  } = props

  return (
    <div className="table__header">
      {React.createElement(headerLeftComponent, { ...props, count, limit, list, offset, ...headerProps })}
      {visibleColumnsSelectionEnabled && totalCount > 0 && (
        <VisibleColumnsMenu
          columns={columns}
          onSelectionChange={onVisibleColumnsChange}
          selectedColumnKeys={visibleColumnKeys}
        />
      )}
    </div>
  )
}

Header.propTypes = {
  columns: PropTypes.array,
  count: PropTypes.number.isRequired,
  headerLeftComponent: PropTypes.elementType.isRequired,
  headerProps: PropTypes.object,
  limit: PropTypes.number.isRequired,
  list: PropTypes.array.isRequired,
  offset: PropTypes.number.isRequired,
  onVisibleColumnsChange: PropTypes.func.isRequired,
  totalCount: PropTypes.number.isRequired,
  visibleColumnsSelectionEnabled: PropTypes.bool,
  visibleColumnKeys: PropTypes.array.isRequired,
}

export default Header
