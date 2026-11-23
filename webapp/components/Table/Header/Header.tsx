import React from 'react'

import { VisibleColumnsMenu } from './VisibleColumnsMenu'

type HeaderProps = {
  // search, handleSearch and selectedItems are passed through to headerLeftComponent
  search?: string
  handleSearch?: (...args: any[]) => any
  selectedItems?: any[]
  columns?: any[]
  count: number
  headerLeftComponent: React.ElementType
  headerProps?: Record<string, any>
  limit: number
  list: any[]
  offset: number
  onVisibleColumnsChange: (...args: any[]) => any
  totalCount: number
  visibleColumnsSelectionEnabled?: boolean
  visibleColumnKeys: any[]
}

const Header = (props: HeaderProps) => {
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

export default Header
