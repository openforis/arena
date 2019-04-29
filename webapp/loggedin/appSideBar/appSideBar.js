import './appSideBar.scss'

import React from 'react'
import { connect } from 'react-redux'

import AppSideBarFooter from './appSideBarFooter'
import AppSideBarModules from './appSideBarModules'

import * as SurveyState from '../../survey/surveyState'
import { getUser } from '../../app/appState'
import { logout } from '../../app/actions'

class AppSideBar extends React.Component {

  constructor () {
    super()
    this.state = {opened: false}
    this.element = React.createRef()
  }

  toggleOpen () {
    this.element.current.classList.toggle('opened')
    this.setState({opened: !this.state.opened})

    //react-grid-layout re-render
    // window.dispatchEvent(new Event('resize'))
  }

  render () {
    const {opened} = this.state
    const {pathname, user, surveyInfo, logout} = this.props

    return (
      <div className="app-sidebar" ref={this.element}>

        {/*toggle sidebar */}
        <a className="btn btn-s btn-of-light-xs no-border app-sidebar__btn-toggle"
           onClick={() => this.toggleOpen()}>
          <span className={`icon icon-${opened ? 'shrink2' : 'enlarge2'} icon-16px`}/>
        </a>

        <AppSideBarModules pathname={pathname}
                           surveyInfo={surveyInfo}
                           sideBarOpened={opened}/>

        <AppSideBarFooter surveyInfo={surveyInfo}
                          user={user}
                          opened={opened}
                          logout={logout}/>

      </div>
    )
  }

}

const mapStateToProps = state => ({
  user: getUser(state),
  surveyInfo: SurveyState.getSurveyInfo(state)
})

export default connect(mapStateToProps, {logout})(AppSideBar)