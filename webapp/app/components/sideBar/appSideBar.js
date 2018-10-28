import React from 'react'
import { connect } from 'react-redux'

import { getSurveyInfo } from '../../../../common/survey/survey'
import { appState } from '../../app'
import { getSurveyState } from '../../../survey/surveyState'
import { logout } from '../../actions'

import AppSideBarFooter from './appSideBarFooter'
import AppSideBarModules from './appSideBarModules'

class AppSideBar extends React.Component {

  constructor () {
    super()
    this.state = {opened: false}
  }

  toggleOpen () {
    const {opened} = this.state

    const width = opened ? 60 : 200
    document.getElementsByClassName('app__container')[0].style.gridTemplateColumns = `${width}px 1fr`

    this.setState({opened: !opened})

    //react-grid-layout re-render
    // window.dispatchEvent(new Event('resize'))
  }

  render () {
    const {opened} = this.state
    const {history, user, surveyInfo} = this.props

    return (
      <div className="app-sidebar">

        {/*toggle sidebar */}
        <div style={{
          display: 'grid',
          width: '100%',
          justifyItems: 'end',
          opacity: '.5',
        }}>
          <a className="btn btn-s btn-of-light-xs no-border"
             onClick={() => this.toggleOpen()}>
            <span className={`icon icon-${opened ? 'shrink2' : 'enlarge2'} icon-16px`}/>
          </a>
        </div>

        <AppSideBarModules history={history}
                           surveyInfo={surveyInfo}
                           opened={opened}/>

        <AppSideBarFooter surveyInfo={surveyInfo}
                          user={user}
                          opened={opened}/>

      </div>
    )
  }

}

const mapStateToProps = state => ({
  user: appState.getUser(state),
  surveyInfo: getSurveyInfo(getSurveyState(state))
})

export default connect(mapStateToProps, {logout})(AppSideBar)