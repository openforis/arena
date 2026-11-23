import './Tabs.scss'

import { useState } from 'react'
import classNames from 'classnames'
import MuiTabs from '@mui/material/Tabs'
import MuiTab from '@mui/material/Tab'

import { useI18n } from '@webapp/store/system'

type TabsProps = {
  fullWidth?: boolean
  items: any[]
  onChange?: (...args: any[]) => any
  orientation?: 'vertical' | 'horizontal'
  selectedItemKey?: string
}

export const Tabs = (props: TabsProps) => {
  const { fullWidth = false, items, onChange: onChangeProp, orientation = 'horizontal', selectedItemKey } = props

  const [selectedIndexState, setSelectedIndexState] = useState(0)

  const i18n = useI18n()

  // Controlled mode (selectedItemKey given by the caller) is opt-in, so existing uncontrolled
  // callers like Dashboard.js keep managing the selected tab internally.
  const controlled = selectedItemKey !== undefined && selectedItemKey !== null
  const selectedIndex = controlled
    ? Math.max(
        items.findIndex((item) => item.key === selectedItemKey),
        0
      )
    : selectedIndexState

  const onChange = (_event, newIndex) => {
    if (!controlled) {
      setSelectedIndexState(newIndex)
    }
    onChangeProp?.(items[newIndex].key)
  }

  const selectedItem = items[selectedIndex]

  return (
    <div className={classNames('tabs-wrapper', { vertical: orientation === 'vertical' })}>
      <MuiTabs
        onChange={onChange}
        orientation={orientation}
        value={selectedIndex}
        variant={fullWidth ? 'fullWidth' : 'standard'}
      >
        {items.map((item) => (
          <MuiTab key={item.key} label={i18n.t(item.label)} />
        ))}
      </MuiTabs>
      {selectedItem?.renderContent && (
        <div key={selectedItem.key} className="tab-content">
          {selectedItem.renderContent()}
        </div>
      )}
    </div>
  )
}
