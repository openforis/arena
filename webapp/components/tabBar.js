import './tabBar.scss'
import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { TestId } from '@webapp/utils/testId'
import { Button } from './buttons'

const TabBarButtons = ({ tabs, selection, onClick }) => (
  <div className="flex-center tab-bar__header">
    {tabs.map((tab, i) => (
      <Button
        key={String(i)}
        active={i === selection}
        disabled={Boolean(tab.disabled)}
        iconClassName={tab.icon ? `${tab.icon} icon-12px` : undefined}
        label={tab.label}
        onClick={() => onClick(i)}
        testId={tab.id ? TestId.tabBar.tabBarBtn(tab.id) : null}
        variant="outlined"
      />
    ))}
  </div>
)

const TabPropType = PropTypes.shape({
  id: PropTypes.string,
  label: PropTypes.string.isRequired,
  icon: PropTypes.string,
  disabled: PropTypes.bool,
})

TabBarButtons.propTypes = {
  tabs: PropTypes.arrayOf(TabPropType).isRequired,
  selection: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
}

const TabBar = (props) => {
  const { className = '', onClick = null, renderer = null, selection = 0, showTabs = true, tabs = [] } = props

  const [selectionState, setSelectionState] = useState(selection)

  const actualSelection = Math.min(selectionState, tabs.length - 1)

  const selectedTab = tabs[actualSelection]

  return (
    <div className={classNames('tab-bar', className, { 'no-tabs': !showTabs })}>
      {showTabs && (
        <TabBarButtons
          tabs={tabs}
          selection={actualSelection}
          onClick={(tabIndex) => {
            setSelectionState(tabIndex)
            if (onClick) {
              onClick(tabs[tabIndex])
            }
          }}
        />
      )}

      {renderer
        ? React.createElement(renderer, { ...props })
        : React.createElement(selectedTab.component, { ...selectedTab.props, ...props })}
    </div>
  )
}

TabBar.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func,
  renderer: PropTypes.func,
  selection: PropTypes.number,
  showTabs: PropTypes.bool,
  tabs: PropTypes.arrayOf(TabPropType).isRequired,
}

export default TabBar
