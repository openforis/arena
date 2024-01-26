import './Tabs.scss'

import React, { useState } from 'react'
import classNames from 'classnames'
import MuiTabs from '@mui/material/Tabs'
import MuiTab from '@mui/material/Tab'

import { useI18n } from '@webapp/store/system'

export const Tabs = (props) => {
  const { items, orientation } = props

  const [selectedIndex, setSelectedIndex] = useState(0)

  const i18n = useI18n()

  const onChange = (_event, newIndex) => {
    setSelectedIndex(newIndex)
  }

  return (
    <div className={classNames('tabs-wrapper', { vertical: orientation === 'vertical' })}>
      <MuiTabs onChange={onChange} orientation={orientation} value={selectedIndex}>
        {items.map((item) => (
          <MuiTab key={item.key} label={i18n.t(item.label)} />
        ))}
      </MuiTabs>
      {items.map((item, index) => (
        <div key={item.key} className="tab-content" hidden={selectedIndex !== index}>
          {item.content}
        </div>
      ))}
    </div>
  )
}
