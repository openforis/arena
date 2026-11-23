import PropTypes from 'prop-types'

import { ButtonIconExpandToggle } from '@webapp/components/buttons'

import { ContentRowCell } from './ContentRowCell'

export const ContentRowCells = (props) => {
  const {
    active,
    cellProps = {},
    cellTestIdExtractor,
    columns,
    expandableRows,
    initData,
    isRowExpandable,
    item,
    itemPosition,
    itemSelected,
    onItemSelectToggle,
    onRowExpandToggle,
    rowExpanded,
  } = props

  return (
    <>
      {expandableRows && (
        <div>
          {isRowExpandable({ item }) && <ButtonIconExpandToggle expanded={rowExpanded} onClick={onRowExpandToggle} />}
        </div>
      )}
      {columns.map((column) => (
        <ContentRowCell
          key={column.key}
          active={active}
          cellTestIdExtractor={cellTestIdExtractor}
          column={column}
          initData={initData}
          item={item}
          itemPosition={itemPosition}
          itemSelected={itemSelected}
          onItemSelectToggle={onItemSelectToggle}
          {...cellProps}
        />
      ))}
    </>
  )
}

ContentRowCells.propTypes = {
  active: PropTypes.bool,
  cellProps: PropTypes.object,
  cellTestIdExtractor: PropTypes.func,
  columns: PropTypes.array.isRequired,
  expandableRows: PropTypes.bool,
  initData: PropTypes.func,
  isRowExpandable: PropTypes.func.isRequired,
  item: PropTypes.object.isRequired,
  itemPosition: PropTypes.number.isRequired,
  itemSelected: PropTypes.bool,
  onItemSelectToggle: PropTypes.func.isRequired,
  onRowExpandToggle: PropTypes.func.isRequired,
  rowExpanded: PropTypes.bool,
}
