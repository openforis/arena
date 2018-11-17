import React from 'react'
import { Link } from 'react-router-dom'
import * as R from 'ramda'

import { appModuleUri } from '../../../appModules'
import { appModules } from '../../../appModules'

const modules = [
  {
    module: appModules.home,
    icon: 'home2',
    label: 'Home',
  },
  {
    module: appModules.dashboard,
    icon: 'office',
    label: 'Dashboard',
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

const AppSideBarModule = (props) => {
  const {
    pathname, module, surveyInfo,
    //module props
    icon, label, showLabel = false, disabled = false,
  } = props

  const active = R.startsWith(appModuleUri(module), pathname)
  const requireSurvey = module !== appModules.home

  return (
    <React.Fragment>
      <Link className={`btn btn-s btn-of-light-xs${active ? ' active' : ''}`}
            to={appModuleUri(module)}
            aria-disabled={disabled || (requireSurvey && (R.isEmpty(surveyInfo) || R.isNil(surveyInfo)))}>
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

const AppSideBarModules = ({pathname, surveyInfo, opened}) => (
  <div className="app-sidebar__modules">
    {
      modules.map((m, i) => (
        <AppSideBarModule key={i}
                          {...m}
                          pathname={pathname}
                          surveyInfo={surveyInfo}
                          showLabel={opened}
        />
      ))
    }
    <div className="separator-of"></div>
  </div>
)

export default AppSideBarModules