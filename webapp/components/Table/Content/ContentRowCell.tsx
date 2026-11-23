type ContentRowCellProps = {
  active?: boolean
  cellTestIdExtractor?: (...args: any[]) => any
  column: Record<string, any>
  item: Record<string, any>
  itemPosition: number
  itemSelected: boolean
  initData: (...args: any[]) => any
  onItemSelectToggle: (...args: any[]) => any
}

export const ContentRowCell = (props: ContentRowCellProps) => {
  const {
    active,
    cellTestIdExtractor,
    column,
    item,
    itemPosition,
    itemSelected,
    initData,
    onItemSelectToggle,
    ...otherProps
  } = props

  const { key, className, renderItem } = column

  const testId = cellTestIdExtractor ? cellTestIdExtractor({ column, item }) : null

  return (
    <div key={key} className={className} data-testid={testId}>
      {renderItem({ ...otherProps, active, item, itemPosition, itemSelected, initData, onItemSelectToggle })}
    </div>
  )
}
