import './tabBar.scss'
import React, { useState } from 'react'
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

const TabBar = (props) => {
  const { className = '', onClick = null, renderer = null, selection = 0, showTabs = true, tabs = [] } = props

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

export default TabBar
