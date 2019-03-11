import './navigationTabBar.scss'

import React from 'react'
import { Route, Switch, withRouter } from 'react-router'
import { Redirect } from 'react-router-dom'
import * as R from 'ramda'

import TabBar from '../../commonComponents/tabBar'

import { appModuleUri } from '../appModules'

const TabBarSwitch = ({ tabs, ...rest }) => (
  <Switch location={rest.location}>
    {
      tabs.map((tab, i) =>
        <Route key={i} exact path={tab.path} render={props =>
          React.createElement(tab.component, { ...tab.props, ...rest })
        }/>
      )
    }
  </Switch>
)

const NavigationTabBar = props => {

  const {
    tabs, className,
    history, location,
    moduleRoot, moduleDefault,
  } = props

  const isRootUri = location.pathname === appModuleUri(moduleRoot)

  const selection = R.findIndex(R.propEq('path', location.pathname), tabs)

  return isRootUri
    ? (
      <Redirect to={appModuleUri(moduleDefault)}/>
    ) : (
      <TabBar
        className={`${className} app-module__tab-navigation`}
        tabs={tabs}
        selection={selection}
        onClick={tab => history.push(tab.path)}
        history={history}
        location={location}
        renderer={TabBarSwitch}
      />
    )
}

NavigationTabBar.defaultProps = {
  tabs: [],
  className: '',
  moduleRoot: '',
  moduleDefault: '',
}

export default withRouter(NavigationTabBar)