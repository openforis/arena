import { ButtonIconExpandToggle } from '@webapp/components/buttons'

import { ContentRowCell } from './ContentRowCell'

type ContentRowCellsProps = {
  active?: boolean
  cellProps?: Record<string, any>
  cellTestIdExtractor?: (...args: any[]) => any
  columns: any[]
  expandableRows?: boolean
  initData?: (...args: any[]) => any
  isRowExpandable: (...args: any[]) => any
  item: Record<string, any>
  itemPosition: number
  itemSelected?: boolean
  onItemSelectToggle: (...args: any[]) => any
  onRowExpandToggle: (...args: any[]) => any
  rowExpanded?: boolean
}

export const ContentRowCells = (props: ContentRowCellsProps) => {
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
