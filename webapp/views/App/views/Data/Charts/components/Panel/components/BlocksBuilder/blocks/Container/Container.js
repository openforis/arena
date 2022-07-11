import React, { useState } from 'react'
import './Container.scss'
import { Button } from '@webapp/components'
import RenderByType from '../BlockRenderer/BlockRenderer'
import classNames from 'classnames'
const ContainerBlock = ({ config, configItemsByPath, configActions, blockPath = '', dimensions, block }) => {
  const [isVisible, setIsVisible] = useState(true)
  const { title, subtitle, blocks, order } = block

  return (
    <div className="block block-container">
      <div className="block-header">
        <div className="block-header-text">
          <span className="block__title">{title}</span>
          <span className="block__subtitle">{subtitle}</span>
        </div>
        <div className="block-button-container">
          <Button
            showLabel={false}
            size="small"
            onClick={() => setIsVisible(!isVisible)}
            iconClassName={classNames('icon-10px', { 'icon-shrink2': isVisible, 'icon-enlarge2': !isVisible })}
          />
        </div>
      </div>

      <hr className="block-container__separator" />
      <div className={classNames('block-container__blocks', { visible: isVisible })}>
        {order.map((blockKey) =>
          React.createElement(RenderByType[blocks[blockKey].type], {
            key: blockKey,
            dimensions,

            block: blocks[blockKey],
            config,
            configItemsByPath,
            configActions,
            blockPath: blockPath ? blockPath.split('.').concat([blockKey]).join('.') : blockKey,
          })
        )}
      </div>
    </div>
  )
}

export default ContainerBlock
