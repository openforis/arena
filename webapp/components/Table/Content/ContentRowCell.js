import PropTypes from 'prop-types'

export const ContentRowCell = (props) => {
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

ContentRowCell.propTypes = {
  active: PropTypes.bool,
  cellTestIdExtractor: PropTypes.func,
  column: PropTypes.object.isRequired,
  item: PropTypes.object.isRequired,
  itemPosition: PropTypes.number.isRequired,
  itemSelected: PropTypes.bool.isRequired,
  initData: PropTypes.func.isRequired,
  onItemSelectToggle: PropTypes.func.isRequired,
}
