import './Panel.scss'
import React from 'react'
import PropTypes from 'prop-types'

import BlocksBuilder from './components/BlocksBuilder'

const Panel = ({ config, configItemsByPath, configActions, dimensions }) => {
  return (
    <div className="charts_panel__container">
      <BlocksBuilder
        dimensions={dimensions}
        config={config}
        configItemsByPath={configItemsByPath}
        configActions={configActions}
      />
    </div>
  )
}

Panel.propTypes = {
  config: PropTypes.arrayOf(PropTypes.any),
  configItemsByPath: PropTypes.arrayOf(PropTypes.any),
  configActions: PropTypes.arrayOf(PropTypes.any),
  dimensions: PropTypes.arrayOf(PropTypes.any),
}

export default Panel
