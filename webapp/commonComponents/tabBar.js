import './tabBar.scss'

import React, { useState } from 'react'

const TabBarButtons = ({ tabs, selection, onClick }) => (
  <div className="flex-center tab-bar__header">
    {tabs.map((tab, i) => (
      <button
        key={i}
        className={`btn${i === selection ? ' active' : ''}`}
        onClick={() => onClick(i)}
        aria-disabled={Boolean(tab.disabled)}
      >
        {tab.icon && <span className={`icon ${tab.icon} icon-12px icon-left`} />}
        {tab.label}
      </button>
    ))}
  </div>
)

const TabBar = (props) => {
  const { tabs, showTabs, selection, className, renderer, onClick } = props
  const [selectionState, setSelectionState] = useState(selection)

  const tab = tabs[selectionState]

  return (
    <div className={`tab-bar ${className}`}>
      {showTabs ? (
        <TabBarButtons
          tabs={tabs}
          selection={selectionState}
          onClick={(tabIndex) => {
            setSelectionState(tabIndex)
            if (onClick) {
              onClick(tabs[tabIndex])
            }
          }}
        />
      ) : (
        <div />
      )}

      {renderer
        ? React.createElement(renderer, { ...props })
        : React.createElement(tab.component, { ...tab.props, ...props })}
    </div>
  )
}

TabBar.defaultProps = {
  className: '',
  selection: 0,
  tabs: [],
  showTabs: true,
  renderer: null,
  onClick: null,
}

export default TabBar
