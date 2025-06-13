import React, { forwardRef } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { TestId } from '@webapp/utils/testId'

import * as SideBarModule from '../utils'
import ModuleLink from '../ModuleLink'
import SubModules from '../SubModules'

const Module = forwardRef((props, ref) => {
  const { disabled = false, isOver = false, module, pathname, onMouseEnter, sideBarOpened = false, surveyInfo } = props

  const isModuleHome = SideBarModule.isHome(module)
  const isSurveySelectionRequired = SideBarModule.isSurveySelectionRequired(module)

  const active = SideBarModule.isActive(pathname)(module)
  // All modules except home require the survey
  const disabledRequiredSurvey = isSurveySelectionRequired && (R.isEmpty(surveyInfo) || R.isNil(surveyInfo))
  // Module home is disabled when page is on dashboard, other modules are disabled when there's no active survey
  const disabledModule = disabled || (isModuleHome ? active : disabledRequiredSurvey)
  // Link to home is disabled when page is on dashboard, other root module links are always disabled
  const disabledModuleLink = disabled || (isModuleHome ? active : true)

  return (
    <div
      className={`sidebar__module${active ? ' active' : ''}${isOver ? ' over' : ''}`}
      data-testid={TestId.sidebar.module(SideBarModule.getKey(module))}
      ref={ref}
      onMouseEnter={isModuleHome || sideBarOpened ? null : () => onMouseEnter(module)}
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
          disabled={disabledModule || disabledRequiredSurvey}
          module={module}
          pathname={pathname}
          sideBarOpened={sideBarOpened}
        />
      )}
    </div>
  )
})

Module.propTypes = {
  disabled: PropTypes.bool,
  surveyInfo: PropTypes.object,
  module: PropTypes.object,
  pathname: PropTypes.string,
  sideBarOpened: PropTypes.bool,
  isOver: PropTypes.bool,
  onMouseEnter: PropTypes.func,
}

export default Module
