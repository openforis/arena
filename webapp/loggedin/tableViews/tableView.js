import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import { useOnSurveyCycleUpdate, useSurveyId } from '@webapp/commonComponents/hooks'
import TableHeader from './components/tableHeader'
import TableContent from './components/tableContent'

import { initListItems, reloadListItems } from './actions'

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
    reloadOnSurveyCycleUpdate,
    restParams,
    rowComponent,
    rowHeaderComponent,
  } = props

  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const apiUri = moduleApiUri || `/api/survey/${surveyId}/${module}`

  useEffect(() => {
    dispatch(initListItems(module, apiUri, restParams))
  }, [])

  if (reloadOnSurveyCycleUpdate) {
    useOnSurveyCycleUpdate(() => {
      dispatch(reloadListItems(module, restParams))
    })
  }

  return (
    <div className={`table ${className}`}>
      <TableHeader apiUri={apiUri} headerLeftComponent={headerLeftComponent} module={module} restParams={restParams} />

      <TableContent
        module={module}
        gridTemplateColumns={gridTemplateColumns}
        isRowActive={isRowActive}
        noItemsLabelKey={noItemsLabelKey}
        onRowClick={onRowClick}
        rowComponent={rowComponent}
        rowHeaderComponent={rowHeaderComponent}
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
  reloadOnSurveyCycleUpdate: PropTypes.bool,
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
  reloadOnSurveyCycleUpdate: false,
  restParams: {},
  rowHeaderComponent: DummyComponent,
  rowComponent: DummyComponent,
}

export default TableView
