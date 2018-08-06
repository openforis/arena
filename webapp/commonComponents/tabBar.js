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
      <div style={{
        display: 'grid',
        gridTemplateRows: '60px 1fr',
      }}>
        <div className="flex-center">
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

        {React.createElement(tabs[selection].component, tabs[selection].props)}

      </div>
    )
  }

}

TabBar.defaultProps = {
  selection: 0,
  tabs: []
}

export default TabBar
