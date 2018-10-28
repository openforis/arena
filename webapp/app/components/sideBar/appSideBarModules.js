import React from 'react'
import { Link } from 'react-router-dom'

import { appModuleUri } from '../../app'
import { appModules } from '../../../appModules/appModules'
import { getLocationPathname } from '../../../appUtils/routerUtils'

const modules = [
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

const AppSideBarModule = (props) => {
  const {
    history, module, surveyInfo,
    //module props
    icon, label, showLabel = false, disabled = false,
  } = props

  const active = getLocationPathname(history) === appModuleUri(module)
  const requireSurvey = module !== appModules.home

  return (
    <React.Fragment>
      <Link className={`btn btn-s btn-of-light-xs${active ? ' active' : ''}`}
            to={appModuleUri(module)}
            aria-disabled={disabled || (requireSurvey && !surveyInfo)}>
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

const AppSideBarModules = ({history, surveyInfo, opened}) => (
  <div style={{
    display: 'grid',
    gridRowGap: '1.5rem',
  }}>
    {
      modules.map((m, i) => (
        <AppSideBarModule key={i}
                          {...m}
                          history={history}
                          surveyInfo={surveyInfo}
                          showLabel={opened}
        />
      ))
    }
    <div className="separator-of"></div>
  </div>
)

export default AppSideBarModules
