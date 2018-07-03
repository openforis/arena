// import './app.scss'

import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Switch, Route } from 'react-router'

import LoginView from '../login/loginView'

class App extends React.Component {

  render () {
    return <Switch>
      <Route exact path="/" component={LoginView}/>
    </Switch>
  }
}

export default App