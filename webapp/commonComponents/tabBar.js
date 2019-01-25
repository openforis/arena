import './tabBar.scss'

import React from 'react'
import { Switch, Route, matchPath } from 'react-router'

const TabBarButtons = ({ tabs, location, selection, onClick }) => (
  <div className="flex-center">
    {
      tabs.map((tab, i) => {
        const active = location
          ? matchPath(location.pathname, tab.path)
          : i === selection

        return tab.showTab === false
          ? null
          : (
            <button key={i}
                    className={`btn btn-of${active ? ' active' : ''}`}
                    onClick={() => onClick(i)}>
              {tab.label}
            </button>
          )
      })
    }
  </div>
)

const TabBarComponent = ({ tab, ...rest }) =>
  typeof tab.component === 'object'
    ? tab.component
    : React.createElement(tab.component, { ...tab.props, ...rest })

const TabBarSwitch = ({ tabs, location }) => (
  <Switch location={location}>
    {
      tabs.map((tab, i) =>
        <Route key={i} exact path={tab.path} render={props =>
          <TabBarComponent tab={tab} {...props}/>
        }/>
      )
    }
  </Switch>
)

class TabBar extends React.Component {

  constructor (props) {
    super(props)

    this.state = { selection: TabBar.defaultProps.selection }
  }

  render () {
    const { tabs, location, history, className } = this.props
    const { selection } = this.state

    return (
      <div className={`tab-bar ${className}`}>

        <TabBarButtons tabs={tabs}
                       location={location}
                       selection={this.state.selection}
                       onClick={tabIndex => location
                         ? history.push(tabs[tabIndex].path)
                         : this.setState({ selection: tabIndex })
                       }/>


        {
          location
            ? <TabBarSwitch tabs={tabs} location={location}/>
            : <TabBarComponent tab={tabs[selection]}/>
        }

      </div>
    )
  }

}

TabBar.defaultProps = {
  className: '',
  selection: 0,
  tabs: [],
  // pass location and history if components should be rendered based on url path
  location: null,
  history: null,
}

export default TabBar
