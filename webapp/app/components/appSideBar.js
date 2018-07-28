import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import { appState, appModuleUri } from '../app'
import { logout } from '../actions'
import { appModules } from '../../appModules/appModules'
import { getLocationPathname } from '../../app-utils/routerUtils'

const appModulesSideBar = [
  {
    module: appModules.home,
    icon: 'home2',
    label: 'Home',
  },
  {
    module: appModules.surveyDashboard,
    icon: 'office',
    label: 'Survey Dashboard',
  },
  {
    module: appModules.surveyDesigner,
    icon: 'quill',
    label: 'Survey Designer',
  },
  {
    module: appModules.dataExplorer,
    icon: 'table2',
    label: 'Data Explorer',
    disabled: true,
  },
  {
    module: appModules.dataAnalysis,
    icon: 'calculator',
    label: 'Data Analysis',
    disabled: true,
  },
  {
    module: appModules.users,
    icon: 'users',
    label: 'Users',
    disabled: true,
  },
]

const AppModuleSideBarLink = ({module, icon, label, showLabel = false, disabled = false, ...props}) => {
  const active = getLocationPathname(props) === appModuleUri(module)

  return (
    <Link className={`btn btn-s btn-of-light-xs${active ? ' active' : ''}`}
          to={appModuleUri(module)}
          aria-disabled={disabled}>
      <span className={`icon icon-${icon} icon-20px${showLabel ? ' icon-left' : ''}`}></span>
      {
        showLabel
          ? <span>{label}</span>
          : null
      }
    </Link>
  )
}

class AppSideBar extends React.Component {

  constructor () {
    super()

    this.state = {opened: false}
  }

  toggleOpen () {
    const opened = this.state.opened

    const width = opened ? 60 : 230
    document.getElementsByClassName('app__container')[0].style.gridTemplateColumns = `${width}px 1fr`

    this.setState({opened: !opened})

  }

  render () {
    const {user, logout} = this.props
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
          <a className="btn btn-s btn-of-light-xs"
             onClick={() => this.toggleOpen()}>
            <span className="icon icon-tab icon-16px"/>
          </a>
        </div>

        {/*app modules*/}
        <div style={{
          display: 'grid',
          gridRowGap: '1.5rem',
        }}>
          {
            appModulesSideBar.map((m, i) => (
              <AppModuleSideBarLink key={i}
                                    {...m}
                                    showLabel={opened}
                                    {...this.props}/>
            ))
          }
        </div>

        {/*footer*/}
        <div>
          {/*<h6 className="text-uppercase">{user && user.name}</h6>*/}
          <a className="btn btn-s btn-of-light-xs"
             onClick={() => logout()}>
            <span className={`icon icon-exit ${opened ? ' icon-left' : ''}`}
                  style={{transform: 'scaleX(-1)'}}/>
            {
              opened
                ? <span>Logout</span>
                : null
            }
          </a>
        </div>

      </div>
    )
  }

}

const mapStateToProps = state => ({
  user: appState.getUser(state)
})

export default connect(mapStateToProps, {logout})(AppSideBar)