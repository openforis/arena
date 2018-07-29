import React from 'react'
import { Link } from 'react-router-dom'

import { appModules } from '../../appModules/appModules'
import { getLocationPathname } from '../../app-utils/routerUtils'
import { appModuleUri } from '../app'

export const appModulesSideBar = [
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
    module: appModules.dataExplorer,
    icon: 'table2',
    label: 'Data',
    disabled: true,
  },
  {
    module: appModules.dataAnalysis,
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

export const AppSideBarModules = ({opened, ...props}) => (
  <div style={{
    display: 'grid',
    gridRowGap: '1.5rem',
  }}>
    {
      appModulesSideBar.map((m, i) => (
        <AppSideBarModule key={i}
                          {...m}
                          showLabel={opened}
                          {...props}/>
      ))
    }
    <div className="separator-of"></div>
  </div>
)

const AppSideBarModule = (props) => {
  const {module, icon, label, showLabel = false, disabled = false, survey} = props

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

export const AppSideBarFooter = ({logout, opened}) => (
  <div style={{
    display: 'grid',
    justifyItems: 'center',
    alignContent: 'space-around',
    height: '100%',
  }}>
    <a className="btn btn-s btn-of-light-xs"
       onClick={() => logout()}
       style={{
         display: 'flex',
         alignItems: 'baseline',
       }}>
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
)
