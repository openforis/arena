import './tabBar.scss'

import React from 'react'

class TabBar extends React.Component {

  constructor (props) {
    super(props)

    this.state = {selection: TabBar.defaultProps.selection}
  }

  render () {
    const {tabs} = this.props
    const {selection} = this.state

    return (
      <div className="tab-bar">
        <div className="tab-bar__nav flex-center">
          {
            tabs.map((tab, i) => {
              return (
                <button key={i}
                        className={`btn btn-of${i === selection ? ' active' : ''}`}
                        onClick={() => this.setState({selection: i})}>
                  {tab.label}
                </button>
              )
            })
          }
        </div>

        <div className="tab-bar__item">
          {React.createElement(tabs[selection].component)}
        </div>

      </div>
    )
  }

}

TabBar.defaultProps = {
  selection: 0,
  tabs: []
}

export default TabBar
