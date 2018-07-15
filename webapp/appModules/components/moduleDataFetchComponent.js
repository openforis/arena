import React from 'react'
import { withRouter } from 'react-router-dom'

import { fetchData } from '../actions'
import { connect } from 'react-redux'

import { appPath } from '../../app/app'
import { getLocationPathname } from '../../app-utils/routerUtils'

class ModuleDataFetchComponent extends React.Component {

  fetchData () {
    const {fetchData, module, dashboard} = this.props
    fetchData(module, dashboard)
  }

  onModulePathEnter () {
    this.fetchData()
  }

  matchesPath () {
    const {module, pathname, dashboard} = this.props
    return appPath.matches(pathname, module, dashboard)
  }

  componentDidMount () {
    if (this.matchesPath())
      this.onModulePathEnter()
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    const {pathname} = this.props
    const {pathname: prevPathName} = prevProps

    if (prevPathName !== pathname && this.matchesPath()) {
      this.onModulePathEnter()
    }
  }

  render () {
    return this.props.children
  }
}

ModuleDataFetchComponent.defaultProps = {
  module: '',
  dashboard: false,
  pathname: '/',
}

const mapStateToProps = (state, props) => ({
  pathname: getLocationPathname(props)
})

export default withRouter(
  connect(mapStateToProps, {fetchData})(ModuleDataFetchComponent)
)