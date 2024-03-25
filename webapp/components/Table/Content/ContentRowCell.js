import React from 'react'

export const ContentRowCell = (props) => {
  const { active, cellTestIdExtractor, column, item, itemPosition, itemSelected, initData } = props

  const { key, className, renderItem } = column

  const testId = cellTestIdExtractor ? cellTestIdExtractor({ column, item }) : null

  return (
    <div key={key} className={className} data-testid={testId}>
      {renderItem({ active, item, itemPosition, itemSelected, initData })}
    </div>
  )
}
