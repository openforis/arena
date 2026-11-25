import { forwardRef } from 'react'

import * as A from '@core/arena'
import { TestId } from '@webapp/utils/testId'
import ModuleLink from '../ModuleLink'
import SubModules from '../SubModules'
import * as SideBarModule from '../utils'

type ModuleProps = {
  disabled?: boolean
  surveyInfo?: Record<string, any>
  module?: Record<string, any>
  pathname?: string
  sideBarOpened?: boolean
  isOver?: boolean
  onMouseEnter?: (...args: any[]) => any
}

const Module = forwardRef<HTMLDivElement, ModuleProps>((props, ref) => {
  const { disabled = false, isOver = false, module, pathname, onMouseEnter, sideBarOpened = false, surveyInfo } = props

  const isModuleHome = SideBarModule.isHome(module)
  const isSurveySelectionRequired = SideBarModule.isSurveySelectionRequired(module)
  const hasChildren = SideBarModule.getChildren(module).length > 0

  const active = SideBarModule.isActive(pathname)(module)
  // All modules except home require the survey
  const disabledRequiredSurvey = isSurveySelectionRequired && (A.isEmpty(surveyInfo) || A.isNil(surveyInfo))
  // Module home is disabled when page is on landing, other modules are disabled when there's no active survey
  const disabledModule = disabled || (isModuleHome ? active : disabledRequiredSurvey)
  // Home link disabled when already on landing; root modules with children navigate via children/popup;
  // leaf root modules (e.g. Dashboard) keep a clickable root link.
  const disabledModuleLink = disabled || (isModuleHome ? active : hasChildren)

  return (
    <div
      className={`sidebar__module${active ? ' active' : ''}${isOver ? ' over' : ''}`}
      data-testid={TestId.sidebar.module(SideBarModule.getKey(module))}
      ref={ref}
      onMouseEnter={sideBarOpened ? null : onMouseEnter}
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

export default Module
