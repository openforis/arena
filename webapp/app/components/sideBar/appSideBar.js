import React from 'react'
import { connect } from 'react-redux'

import { appModules } from '../../../appModules/appModules'
import { appState } from '../../app'
import { getSurvey } from '../../../survey/surveyState'
import { logout } from '../../actions'

import AppSideBarFooter from './appSideBarFooter'
import AppSideBarModules from './appSideBarModules'

const appModulesSideBar = [
  {
    module: appModules.home,
    icon: 'home2',
    label: 'Home',
  },
  {
    module: appModules.surveyDashboard,
    icon: 'office',
    label: 'Dashboard',
  },
  {
    module: appModules.surveyDesigner,
    icon: 'quill',
    label: 'Designer',
  },
  {
    module: appModules.data,
    icon: 'table2',
    label: 'Data',
    disabled: true,
  },
  {
    module: appModules.analysis,
    icon: 'calculator',
    label: 'Analysis',
    disabled: true,
  },
  {
    module: appModules.users,
    icon: 'users',
    label: 'Users',
    disabled: true,
  },
]


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
    window.dispatchEvent(new Event('resize'))
  }

  render () {
    const {opened} = this.state

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

        <AppSideBarModules {...this.props} modules={appModulesSideBar} opened={opened}/>

        <AppSideBarFooter {...this.props} opened={opened}/>

      </div>
    )
  }

}

const mapStateToProps = state => ({
  user: appState.getUser(state),
  survey: getSurvey(state)
})

export default connect(mapStateToProps, {logout})(AppSideBar)