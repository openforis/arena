import './tabBar.scss'

import React from 'react'

const TabBarButtons = ({ tabs, selection, onClick }) => (
  <div className="flex-center tab-bar__header">
    {tabs.map((tab, i) => {
      const active = i === selection

      return tab.showTab === false ? null : (
        <button
          key={i}
          className={`btn${active ? ' active' : ''}`}
          onClick={() => onClick(i)}
          aria-disabled={Boolean(tab.disabled)}
        >
          {tab.icon && <span className={`icon ${tab.icon} icon-12px icon-left`} />}
          {tab.label}
        </button>
      )
    })}
  </div>
)

class TabBar extends React.Component {
  constructor(props) {
    super(props)

    this.state = { selection: props.selection || TabBar.defaultProps.selection }
  }

  componentDidUpdate(prevProps) {
    const { selection } = this.props
    const { selection: selectionPrev } = prevProps
    if (selection !== selectionPrev) {
      this.setState({ selection })
    }
  }

  render() {
    const { tabs, className, renderer, onClick } = this.props

    const { selection } = this.state

    const tab = tabs[selection]

    return (
      <div className={`tab-bar ${className}`}>
        <TabBarButtons
          tabs={tabs}
          selection={selection}
          onClick={tabIndex => {
            this.setState({ selection: tabIndex })
            if (onClick) onClick(tabs[tabIndex])
          }}
        />

        {renderer
          ? React.createElement(renderer, { ...this.props })
          : React.createElement(tab.component, { ...tab.props, ...this.props })}
      </div>
    )
  }
}

TabBar.defaultProps = {
  className: '',
  selection: 0,
  tabs: [],
  renderer: null,
  onClick: null,
}

export default TabBar
