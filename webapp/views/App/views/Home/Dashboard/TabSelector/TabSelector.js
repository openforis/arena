// webapp/views/App/views/Home/Dashboard/TabSelector.js
import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import './TabSelector.scss'

const TabSelector = ({ tabs, currentTab, onSelectTab }) => {
  return (
    <div className="tab-selector">
      {Object.keys(tabs).map((tabKey) => (
        <button
          key={tabKey}
          className={classNames('tab-selector__option', { active: currentTab === tabKey })}
          onClick={() => onSelectTab(tabKey)}
        >
          {tabs[tabKey]}
        </button>
      ))}
    </div>
  )
}

TabSelector.propTypes = {
  currentTab: PropTypes.string.isRequired,
  onSelectTab: PropTypes.func.isRequired,
  tabs: PropTypes.objectOf(String).isRequired,
}

export default TabSelector
