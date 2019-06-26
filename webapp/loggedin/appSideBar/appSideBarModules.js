import React from 'react'
import { Link } from 'react-router-dom'
import * as R from 'ramda'

import { appModuleUri, appModules } from '../appModules'

const modules = [
  {
    module: appModules.home,
    icon: 'home2',
    label: 'Home',
  },
  {
    module: appModules.designer,
    icon: 'quill',
    label: 'Designer',
  },
  {
    module: appModules.data,
    icon: 'table2',
    label: 'Data',
  }
  // ,
  // {
  //   module: appModules.analysis,
  //   icon: 'calculator',
  //   label: 'Analysis',
  //   disabled: true,
  // },
  // {
  //   module: appModules.users,
  //   icon: 'users',
  //   label: 'Users',
  //   disabled: true,
  // },
]

const AppSideBarModule = (props) => {
  const {
    pathname, module, surveyInfo,
    //module props
    icon, label, sideBarOpened = false, disabled = false,
  } = props

  const active = R.startsWith(appModuleUri(module), pathname)
  const requireSurvey = module !== appModules.home

  return (
    <React.Fragment>

      <Link
        className="app-sidebar__module-btn text-uppercase"
        to={appModuleUri(module)}
        aria-disabled={disabled || (requireSurvey && (R.isEmpty(surveyInfo) || R.isNil(surveyInfo)))}>
        <span className={`icon icon-${icon} icon-16px${sideBarOpened ? ' icon-left-2x' : ''}`}></span>
        {
          sideBarOpened &&
          <span>{label}</span>
        }

      </Link>

      {
        module === appModules.home &&
        <div className="separator-of"></div>
      }

    </React.Fragment>
  )
}

const AppSideBarModules = ({ pathname, surveyInfo, sideBarOpened }) => (
  <div className="app-sidebar__modules">
    {
      modules.map((m, i) => (
        <AppSideBarModule key={i}
                          {...m}
                          pathname={pathname}
                          surveyInfo={surveyInfo}
                          sideBarOpened={sideBarOpened}
        />
      ))
    }
    <div className="separator-of"></div>
  </div>
)

export default AppSideBarModules