/* eslint react/jsx-props-no-spreading: 0 */
// TODO: Now TableHeader and TableContent need to pass the dynamic ...rest props to components - All components using TableView must be refactor
import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import { useSurveyId } from '@webapp/store/survey'

import TableHeader from './components/tableHeader'
import TableContent from './components/tableContent'

import { initListItems } from './actions'

const TableView = (props) => {
  const {
    className,
    gridTemplateColumns,
    headerLeftComponent,
    isRowActive,
    module,
    moduleApiUri,
    noItemsLabelKey,
    onRowClick,
    restParams,
    rowComponent,
    rowHeaderComponent,
    ...rest
  } = props

  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const apiUri = moduleApiUri || `/api/survey/${surveyId}/${module}`

  useEffect(() => {
    dispatch(initListItems(module, apiUri, restParams))
  }, [])

  return (
    <div className={`table ${className}`}>
      <TableHeader
        apiUri={apiUri}
        headerLeftComponent={headerLeftComponent}
        module={module}
        restParams={restParams}
        {...rest}
      />

      <TableContent
        module={module}
        gridTemplateColumns={gridTemplateColumns}
        isRowActive={isRowActive}
        noItemsLabelKey={noItemsLabelKey}
        onRowClick={onRowClick}
        rowComponent={rowComponent}
        rowHeaderComponent={rowHeaderComponent}
        {...rest}
      />
    </div>
  )
}

const DummyComponent = () => <div />

TableView.propTypes = {
  className: PropTypes.string,
  gridTemplateColumns: PropTypes.string,
  headerLeftComponent: PropTypes.elementType,
  isRowActive: PropTypes.func, // Checks whether a row must be highlighted
  module: PropTypes.string.isRequired,
  moduleApiUri: PropTypes.string,
  noItemsLabelKey: PropTypes.string,
  onRowClick: PropTypes.func, // Row click handler
  restParams: PropTypes.object,
  rowComponent: PropTypes.elementType,
  rowHeaderComponent: PropTypes.elementType,
}

TableView.defaultProps = {
  className: '',
  gridTemplateColumns: '1fr',
  headerLeftComponent: DummyComponent,
  isRowActive: null,
  moduleApiUri: null,
  noItemsLabelKey: 'common.noItems',
  onRowClick: null,
  restParams: {},
  rowHeaderComponent: DummyComponent,
  rowComponent: DummyComponent,
}

export default TableView
