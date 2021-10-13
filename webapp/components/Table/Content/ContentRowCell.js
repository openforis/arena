import React from 'react'

export const ContentRowCell = (props) => {
  const { active, cellTestIdExtractor, column, item } = props

  const { key, renderItem } = column

  const testId = cellTestIdExtractor ? cellTestIdExtractor({ column, item }) : null

  return (
    <div key={key} data-testid={testId}>
      {renderItem({ item, active })}
    </div>
  )
}
