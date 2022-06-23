import React from 'react'

import './Container.scss'

const ContainerBlock = ({ dimensions, block, spec, onUpdateSpec }) => {
  const { title, subtitle, blocks, order, type } = block

  return (
    <div className="block block-container">
      <span className="block-container__title">{title}</span>
      <span className="block-container__subtitle">{subtitle}</span>
      <hr className="block-container__separator" />
      {order.map((blockKey) =>
        React.createElement(RenderByType[blocks[blockKey].type], {
          key: blockKey,
          dimensions,
          spec,
          onUpdateSpec,
          block: blocks[blockKey],
        })
      )}
    </div>
  )
}

export default ContainerBlock
