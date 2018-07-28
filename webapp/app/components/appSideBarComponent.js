import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import { appModuleUri, appState } from '../app'
import { logout } from '../actions'
import { getLocationPathname } from '../../app-utils/routerUtils'
import { appModulesSideBar } from './appSideBar'
import { appModules } from '../../appModules/appModules'
import { surveyState } from '../../survey/surveyState'

const AppModuleSideBarLink = (props) => {
  const {module, icon, label, showLabel = false, disabled = false, survey} = props
  console.log(survey)
  const active = getLocationPathname(props) === appModuleUri(module)
  const requireSurvey = module !== appModules.home

  return (
    <React.Fragment>
      <Link className={`btn btn-s btn-of-light-xs${active ? ' active' : ''}`}
            to={appModuleUri(module)}
            aria-disabled={disabled || (requireSurvey && !survey)}>
        <span className={`icon icon-${icon} icon-20px${showLabel ? ' icon-left' : ''}`}></span>
        {
          showLabel
            ? <span>{label}</span>
            : null
        }
      </Link>
      {
        module === appModules.home
          ? <div className="separator-of"></div>
          : null
      }
    </React.Fragment>
  )
}

class AppSideBarComponent extends React.Component {

  constructor () {
    super()

    this.state = {opened: false}
  }

  toggleOpen () {
    const opened = this.state.opened

    const width = opened ? 60 : 200
    document.getElementsByClassName('app__container')[0].style.gridTemplateColumns = `${width}px 1fr`

    this.setState({opened: !opened})

  }

  render () {
    const {logout} = this.props
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
            <span className={`icon icon-${opened ? 'shrink2' : 'enlarge2'} icon-16px`}/>
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
          <div className="separator-of"></div>
        </div>

        {/*footer*/}
        <div style={{
          display: 'grid',
          justifyItems: 'center',
          alignContent: 'space-around',
          height: '100%',
        }}>
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

          <a className="btn btn-of-link btn-of-sidebar"
             href="http://www.openforis.org"
             target="_blank">
            {
              opened
                ? 'Open Foris' : 'OF'
            }
          </a>
        </div>

      </div>
    )
  }

}

const mapStateToProps = state => ({
  user: appState.getUser(state),
  survey: surveyState.getCurrentSurvey(state)
})

export default connect(mapStateToProps, {logout})(AppSideBarComponent)