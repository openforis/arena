import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { useI18n } from '../../commonComponents/hooks'

import TablePaginator from './components/tablePaginator'

import * as SurveyState from '../../survey/surveyState'
import * as TableViewsState from './tableViewsState'

import { initList, fetchListItems } from './actions'

const TableView = props => {
  const {
    module, moduleApiUri, className,
    headerLeftComponent, gridTemplateColumns,
    rowHeaderComponent, rowComponent, noItemsLabelKey,
    list, offset, limit, count,
    initList, fetchListItems,
    onRowClick,
  } = props

  useEffect(() => {
    initList(module, moduleApiUri)
  }, [])

  const hasItems = !R.isEmpty(list)
  const i18n = useI18n()

  return (
    <div className={`table ${className}`}>

      <div className="table__header">
        {
          React.createElement(headerLeftComponent, props)
        }

        {
          hasItems &&
          <TablePaginator
            offset={offset}
            limit={limit}
            count={count}
            fetchFn={offset => fetchListItems(module, moduleApiUri, offset)}
          />
        }

      </div>

      {
        hasItems
          ? (
            <div className="table__content">
              <div className="table__rows">

                <div className="table__row-header" style={{ gridTemplateColumns }}>
                  {
                    React.createElement(rowHeaderComponent, props)
                  }
                </div>

                {
                  list.map((row, i) => (
                    <div onClick={() => onRowClick && onRowClick(row)}
                         className={`table__row${onRowClick ? ' hoverable' : ''}`}
                         key={i}
                         style={{ gridTemplateColumns }}>
                      {
                        React.createElement(
                          rowComponent,
                          { ...props, idx: i, row }
                        )
                      }
                    </div>
                  ))
                }
              </div>
            </div>
          )
          : (
            <div className="table__empty-rows">
              {i18n.t(noItemsLabelKey)}
            </div>
          )
      }

    </div>
  )
}

TableView.defaultProps = {
  module: '',
  moduleApiUri: null,
  className: '',
  gridTemplateColumns: '1fr',
  headerLeftComponent: () => <div></div>,
  rowHeaderComponent: () => <div></div>,
  rowComponent: () => <div></div>,
  noItemsLabelKey: 'common.noItems',
  onRowClick: null,
}

const mapStateToProps = (state, props) => {
  let { module, moduleApiUri } = props
  moduleApiUri = moduleApiUri || `/api/survey/${SurveyState.getSurveyId(state)}/${module}`

  return {
    moduleApiUri,
    offset: TableViewsState.getOffset(module)(state),
    limit: TableViewsState.getLimit(module)(state),
    count: TableViewsState.getCount(module)(state),
    list: TableViewsState.getList(module)(state),
  }
}

export default connect(
  mapStateToProps,
  { initList, fetchListItems }
)(TableView)
