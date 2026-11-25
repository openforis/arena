import './TabBar.scss'
import React, { useState } from 'react'
import classNames from 'classnames'

import { TestId } from '@webapp/utils/testId'
import { Button } from './buttons'

type Tab = {
  id?: string
  label: string
  icon?: string
  disabled?: boolean
  component?: React.ElementType
  props?: Record<string, unknown>
}

type TabBarButtonsProps = {
  tabs: Tab[]
  selection: number
  onClick: (...args: any[]) => any
}

const TabBarButtons = ({ tabs, selection, onClick }: TabBarButtonsProps) => (
  <div className="flex-center tab-bar__header">
    {tabs.map((tab, i) => (
      <Button
        key={tab.id ?? tab.label}
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

type TabBarProps = {
  className?: string
  onClick?: (...args: any[]) => any
  renderer?: (...args: any[]) => any
  selection?: number
  showTabs?: boolean
  tabs: Tab[]
}

const TabBar = (props: TabBarProps) => {
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

export default TabBar
