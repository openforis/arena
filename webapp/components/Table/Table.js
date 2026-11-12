import classNames from 'classnames'
import PropTypes from 'prop-types'

import * as ObjectUtils from '@core/objectUtils'

import LoadingBar from '../LoadingBar'

import Header from './Header'
import Content from './Content'
import { Footer } from './Footer'
import { useTable } from './useTable'

const Table = (props) => {
  const {
    cellProps = {},
    cellTestIdExtractor = null,
    className = '',
    columns = null,
    expandableRows = false,
    gridTemplateColumns = '1fr',
    headerLeftComponent = DummyComponent,
    headerProps = {},
    isRowActive = null,
    isRowExpandable = () => true,
    isRowOpenable = null,
    keyExtractor = ({ item }) => ObjectUtils.getUuid(item),
    module,
    moduleApiUri = null,
    noItemsLabelKey = 'common.noItems',
    noItemsLabelForSearchKey = 'common.noItems',
    onRowOpen = null,
    restParams = {},
    rowHeaderComponent = DummyComponent,
    rowComponent = DummyComponent,
    rowExpandedComponent = DummyComponent,
    rowProps = {},
    selectable = false,
    showFooter = true,
    showHeader = true,
    visibleColumnsSelectionEnabled = false,
  } = props

  const {
    loadingData,
    loadingCount,
    list,
    offset,
    limit,
    sort,
    search,
    handleSortBy,
    handleSearch,
    count,
    totalCount,
    initData,
    onRowsScroll,
    onVisibleColumnsChange,
    selectedItems,
    selectAllItems,
    deselectAllItems,
    toggleItemSelection,
    visibleColumnKeys,
    visibleColumns,
    allVisibleItemsSelected,
  } = useTable({
    columns,
    keyExtractor,
    moduleApiUri,
    module,
    restParams,
  })

  if (loadingCount && totalCount <= 0) {
    return <LoadingBar />
  }

  return (
    <div className={classNames('table', className, { 'with-footer': showFooter })}>
      {showHeader && (
        <Header
          columns={columns}
          offset={offset}
          list={list}
          limit={limit}
          count={count}
          totalCount={totalCount}
          search={search}
          headerLeftComponent={headerLeftComponent}
          headerProps={headerProps}
          handleSearch={handleSearch}
          onVisibleColumnsChange={onVisibleColumnsChange}
          selectedItems={selectedItems}
          visibleColumnsSelectionEnabled={visibleColumnsSelectionEnabled}
          visibleColumnKeys={visibleColumnKeys}
        />
      )}

      <Content
        cellProps={cellProps}
        cellTestIdExtractor={cellTestIdExtractor}
        gridTemplateColumns={gridTemplateColumns}
        isRowActive={isRowActive}
        keyExtractor={keyExtractor}
        isRowExpandable={isRowExpandable}
        isRowOpenable={isRowOpenable}
        list={list}
        loading={loadingData}
        maxRows={limit}
        module={module}
        count={count}
        totalCount={totalCount}
        noItemsLabelKey={noItemsLabelKey}
        noItemsLabelForSearchKey={noItemsLabelForSearchKey}
        offset={offset}
        onItemSelectToggle={toggleItemSelection}
        onRowOpen={onRowOpen}
        onRowsScroll={onRowsScroll}
        rowComponent={rowComponent}
        rowExpandedComponent={rowExpandedComponent}
        rowHeaderComponent={rowHeaderComponent}
        columns={visibleColumns}
        rowProps={rowProps}
        selectable={selectable}
        expandableRows={expandableRows}
        initData={initData}
        sort={sort}
        handleSortBy={handleSortBy}
        selectedItems={selectedItems}
        selectAllItems={selectAllItems}
        deselectAllItems={deselectAllItems}
        allVisibleItemsSelected={allVisibleItemsSelected}
      />
      {showFooter && (
        <Footer
          count={count}
          limit={limit}
          list={list}
          module={module}
          offset={offset}
          selectedItemsCount={selectedItems.length}
        />
      )}
    </div>
  )
}

const DummyComponent = () => <div />

Table.propTypes = {
  cellProps: PropTypes.object,
  cellTestIdExtractor: PropTypes.func,
  className: PropTypes.string,
  columns: PropTypes.array,
  expandableRows: PropTypes.bool,
  gridTemplateColumns: PropTypes.string,
  headerLeftComponent: PropTypes.elementType,
  headerProps: PropTypes.object,
  isRowActive: PropTypes.func, // Checks whether a row must be highlighted
  isRowExpandable: PropTypes.func, // Checks if a row rendering an item can be expanded
  isRowOpenable: PropTypes.func, // Checks if the item of a row can be opened (onRowOpen); rows that cannot be opened do nothing on click
  keyExtractor: PropTypes.func,
  module: PropTypes.string.isRequired,
  moduleApiUri: PropTypes.string,
  noItemsLabelKey: PropTypes.string,
  noItemsLabelForSearchKey: PropTypes.string,
  onRowOpen: PropTypes.func, // Opens (views or edits) the item of a row: on click, or on double click if the table is selectable
  restParams: PropTypes.object,
  rowComponent: PropTypes.elementType,
  rowExpandedComponent: PropTypes.elementType,
  rowHeaderComponent: PropTypes.elementType,
  rowProps: PropTypes.object,
  selectable: PropTypes.bool, // if true, a row click selects the row and selectedItems is passed to the HeaderLeft component
  showFooter: PropTypes.bool,
  showHeader: PropTypes.bool,
  visibleColumnsSelectionEnabled: PropTypes.bool, // if true, visible columns selection menu button will be shown
}

export default Table
