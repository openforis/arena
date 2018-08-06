import React from 'react'
import { Link } from 'react-router-dom'

import { getLocationPathname } from '../../../appUtils/routerUtils'
import { appModuleUri } from '../../app'
import { appModules } from '../../../appModules/appModules'

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


const AppSideBarModules = ({opened, modules, ...props}) => (
  <div style={{
    display: 'grid',
    gridRowGap: '1.5rem',
  }}>
    {
      modules.map((m, i) => (
        <AppSideBarModule key={i}
                          {...m}
                          showLabel={opened}
                          {...props}/>
      ))
    }
    <div className="separator-of"></div>
  </div>
)

export default AppSideBarModules