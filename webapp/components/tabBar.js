import './tabBar.scss'
import React, { useState } from 'react'

import { DataTestId } from '@webapp/utils/dataTestId'

const TabBarButtons = ({ tabs, selection, onClick }) => (
  <div className="flex-center tab-bar__header">
    {tabs.map((tab, i) => (
      <button
        key={String(i)}
        aria-disabled={Boolean(tab.disabled)}
        className={`btn${i === selection ? ' active' : ''}`}
        data-testid={tab.id ? DataTestId.tabBar.tabBarBtn(tab.id) : null}
        onClick={() => onClick(i)}
        type="button"
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
