import './tabBar.scss'

import React, { useState } from 'react'
import classNames from 'classnames'

import { TestId } from '@webapp/utils/testId'

const TabBarButtons = ({ tabs, selection, onClick }) => (
  <div className="flex-center tab-bar__header">
    {tabs.map((tab, i) => (
      <button
        key={String(i)}
        aria-disabled={Boolean(tab.disabled)}
        className={`btn${i === selection ? ' active' : ''}`}
        data-testid={tab.id ? TestId.tabBar.tabBarBtn(tab.id) : null}
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
    <div className={classNames('tab-bar', className, { 'no-tabs': !showTabs })}>
      {showTabs && (
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
