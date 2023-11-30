import React from 'react'
import PropTypes from 'prop-types'

import { VisibleColumnsMenu } from './VisibleColumnsMenu'

const Header = (props) => {
  const {
    columns,
    headerLeftComponent,
    headerProps,
    onVisibleColumnsChange,
    totalCount,
    visibleColumnsSelectionEnabled,
  } = props

  return (
    <div className="table__header">
      {React.createElement(headerLeftComponent, { ...props, ...headerProps })}
      {visibleColumnsSelectionEnabled && totalCount > 0 && (
        <VisibleColumnsMenu columns={columns} onSelectionChange={onVisibleColumnsChange} />
      )}
    </div>
  )
}

Header.propTypes = {
  columns: PropTypes.array.isRequired,
  count: PropTypes.number.isRequired,
  headerLeftComponent: PropTypes.elementType.isRequired,
  headerProps: PropTypes.object,
  limit: PropTypes.number.isRequired,
  list: PropTypes.array.isRequired,
  offset: PropTypes.number.isRequired,
  onVisibleColumnsChange: PropTypes.func.isRequired,
  totalCount: PropTypes.number.isRequired,
  visibleColumnsSelectionEnabled: PropTypes.bool,
}

Header.defaultProps = {
  headerProps: {},
  visibleColumnsSelectionEnabled: false,
}

export default Header
