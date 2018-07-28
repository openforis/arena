import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import { appState, appModuleUri } from '../app'
import { logout } from '../actions'
import { appModules } from '../../appModules/appModules'

const appModulesSideBar = [
  {module: appModules.home, icon: 'home2'},
  {module: appModules.surveyDashboard, icon: 'office'},
  {module: appModules.surveyDesigner, icon: 'quill', disabled: true},
  {module: appModules.dataExplorer, icon: 'table2', disabled: true},
  {module: appModules.dataAnalysis, icon: 'calculator', disabled: true},
  {module: appModules.users, icon: 'users', disabled: true},
]

const AppModuleSideBarLink = ({module, icon, disabled = false}) => (
  <Link className="btn btn-s btn-of-light-xs"
        to={appModuleUri(module)}
        aria-disabled={disabled}>
    <span className={`icon icon-${icon} icon-20px`}></span>
  </Link>
)

class AppSideBar extends React.Component {

  render () {
    const {user, logout} = this.props

    return (
      <div className="app-sidebar">

        <div style={{
          display: 'grid',
          gridRowGap: '1.5rem',
        }}>
          {
            appModulesSideBar.map((m, i) => (
              <AppModuleSideBarLink key={i}
                                    {...m}/>
            ))
          }
        </div>

        <div>
          {/*<h6 className="text-uppercase">{user && user.name}</h6>*/}
          <button className="btn btn-s btn-of-light-xs icon-right"
                  onClick={() => logout()}>
            <span className="icon icon-exit"/>
          </button>
        </div>

      </div>
    )
  }

}

const mapStateToProps = state => ({
  user: appState.getUser(state)
})

export default connect(mapStateToProps, {logout})(AppSideBar)