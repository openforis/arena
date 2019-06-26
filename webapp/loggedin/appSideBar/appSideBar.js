import './appSideBar.scss'

import React from 'react'
import { connect } from 'react-redux'

import AppSideBarModules from './appSideBarModules'

import * as SurveyState from '../../survey/surveyState'

class AppSideBar extends React.Component {

  constructor () {
    super()
    this.state = { opened: false }
    this.element = React.createRef()
  }

  toggleOpen () {
    this.element.current.classList.toggle('opened')
    this.setState({ opened: !this.state.opened })

    //react-grid-layout re-render
    // window.dispatchEvent(new Event('resize'))
  }

  render () {
    const { opened } = this.state
    const { pathname, surveyInfo } = this.props

    return (
      <div className="app-sidebar" ref={this.element}>

        {/*logo placeholder*/}
        <div></div>


        <AppSideBarModules
          pathname={pathname}
          surveyInfo={surveyInfo}
          sideBarOpened={opened}/>

        <div>
          {/*toggle sidebar */}
          <a className="app-sidebar__btn-toggle"
             onClick={() => this.toggleOpen()}>
            <span className="icon icon-16px icon-menu"/>
          </a>
        </div>

      </div>
    )
  }

}

const mapStateToProps = state => ({
  surveyInfo: SurveyState.getSurveyInfo(state),
})

export default connect(mapStateToProps)(AppSideBar)