import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import TableHeader from './components/tableHeader'
import TableContent from './components/tableContent'

import * as SurveyState from '../../survey/surveyState'
import * as TableViewsState from './tableViewsState'

import { initList, fetchListItems } from './actions'

const TableView = props => {
  const {
    module, moduleApiUri, moduleApiCountUri, className,
    initList
  } = props

  useEffect(() => {
    initList(module, moduleApiUri, moduleApiCountUri)
  }, [])

  return (
    <div className={`table ${className}`}>

      <TableHeader {...props}/>

      <TableContent {...props}/>

    </div>
  )
}

TableView.defaultProps = {
  module: '',
  moduleApiUri: null,
  moduleApiCountUri: null,
  className: '',
  gridTemplateColumns: '1fr',
  headerLeftComponent: () => <div></div>,
  rowHeaderComponent: () => <div></div>,
  rowComponent: () => <div></div>,
  noItemsLabelKey: 'common.noItems',
  onRowClick: null, // function to be passed when an action has to be performed on row click
  isRowActive: null, //function to be passed when a row must be highlighted
}

const mapStateToProps = (state, props) => {
  let { module, moduleApiUri, moduleApiCountUri } = props
  moduleApiUri = moduleApiUri || `/api/survey/${SurveyState.getSurveyId(state)}/${module}`
  moduleApiCountUri = moduleApiCountUri || `${moduleApiUri}/count`

  return {
    moduleApiUri,
    moduleApiCountUri,
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
