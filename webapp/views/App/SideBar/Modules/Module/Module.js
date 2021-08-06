import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { DataTestId } from '@webapp/utils/dataTestId'

import * as SideBarModule from '../utils'
import ModuleLink from '../ModuleLink'
import SubModules from '../SubModules'

const Module = (props) => {
  const { surveyInfo, module, pathname, sideBarOpened, isOver, onMouseEnter } = props

  const elementRef = SideBarModule.getElementRef(module)
  const isModuleHome = SideBarModule.isHome(module)
  const isSurveySelectionRequired = SideBarModule.isSurveySelectionRequired(module)

  const active = SideBarModule.isActive(pathname)(module)
  // All modules except home require the survey
  const disabledRequiredSurvey = isSurveySelectionRequired && (R.isEmpty(surveyInfo) || R.isNil(surveyInfo))
  // Module home is disabled when page is on dashboard, other modules are disabled when there's no active survey
  const disabledModule = isModuleHome ? active : disabledRequiredSurvey
  // Link to home is disabled when page is on dashboard, other root module links are always disabled
  const disabledModuleLink = isModuleHome ? active : true

  return (
    <div
      className={`sidebar__module${active ? ' active' : ''}${isOver ? ' over' : ''}`}
      data-testid={DataTestId.sidebar.module(SideBarModule.getKey(module))}
      ref={elementRef}
      onMouseEnter={
        isModuleHome || sideBarOpened
          ? null
          : () => {
              onMouseEnter(module)
            }
      }
      aria-disabled={disabledModule}
    >
      <ModuleLink
        module={module}
        pathname={pathname}
        showLabel={sideBarOpened}
        disabled={disabledModuleLink || disabledRequiredSurvey}
      />

      {sideBarOpened && (
        <SubModules
          module={module}
          pathname={pathname}
          sideBarOpened={sideBarOpened}
          disabled={disabledRequiredSurvey}
        />
      )}
    </div>
  )
}

Module.propTypes = {
  surveyInfo: PropTypes.object,
  module: PropTypes.object,
  pathname: PropTypes.string,
  sideBarOpened: PropTypes.bool,
  isOver: PropTypes.bool,
  onMouseEnter: PropTypes.func,
}

Module.defaultProps = {
  surveyInfo: null,
  module: null,
  pathname: '',
  sideBarOpened: false,
  isOver: false,
  onMouseEnter: null,
}

export default Module
