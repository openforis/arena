import React, { useRef, useEffect } from 'react'
import PropTypes from 'prop-types'

import * as R from 'ramda'

import { useI18n } from '@webapp/store/system'

const Content = (props) => {
  const {
    gridTemplateColumns,
    isRowActive,
    list,
    module,
    noItemsLabelKey,
    offset,
    onRowClick,
    rowHeaderComponent,
    rowComponent,
    rowProps,
    initData,
  } = props

  const i18n = useI18n()

  const tableRef = useRef(null)

  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.scrollTop = 0
    }
  }, [offset, tableRef])

  return R.isEmpty(list) ? (
    <div className="table__empty-rows">{i18n.t(noItemsLabelKey)}</div>
  ) : (
    <div className="table__content">
      <div className="table__row-header" style={{ gridTemplateColumns }}>
        {React.createElement(rowHeaderComponent, { props, ...rowProps })}
      </div>
      <div className="table__rows" ref={tableRef}>
        {list.map((row, i) => {
          const active = isRowActive && isRowActive(row)
          let className = 'table__row'
          className += onRowClick ? ' hoverable' : ''
          className += active ? ' active' : ''

          return (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/interactive-supports-focus
            <div
              role="button"
              key={String(i)}
              onClick={() => onRowClick && onRowClick(row)}
              className={className}
              id={`${module}_${i}`}
              style={{ gridTemplateColumns }}
            >
              {React.createElement(rowComponent, {
                idx: i,
                offset,
                row,
                rowNo: i + offset + 1,
                active,
                initData,
                ...rowProps,
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

Content.propTypes = {
  gridTemplateColumns: PropTypes.string.isRequired,
  isRowActive: PropTypes.func,
  list: PropTypes.array.isRequired,
  module: PropTypes.string.isRequired,
  noItemsLabelKey: PropTypes.string.isRequired,
  offset: PropTypes.number.isRequired,
  onRowClick: PropTypes.func,
  initData: PropTypes.func,
  rowHeaderComponent: PropTypes.elementType.isRequired,
  rowComponent: PropTypes.elementType.isRequired,
  rowProps: PropTypes.object,
}

Content.defaultProps = {
  isRowActive: null,
  onRowClick: null,
  initData: null,
  rowProps: {},
}

export default Content
