import React from 'react'

class TabBarComponent extends React.Component {

  constructor (props) {
    super(props)

    this.state = {selection: TabBarComponent.defaultProps.selection}
  }

  render () {
    const {tabs} = this.props
    const {selection} = this.state

    return (
      <div style={{
        display: 'grid',
        gridTemplateRows: '.15fr .85fr',
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

TabBarComponent.defaultProps = {
  selection: 0,
  tabs: []
}

export default TabBarComponent
