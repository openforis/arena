import React from 'react'
import { appModuleUri } from '../../appModules'
import { dashboardModules } from '../../dashboard/dashboardModules'
import { Link } from 'react-router-dom'

const FormEditActions = ({preview}) => (
  <div className="survey-form__nav-record-actions">
    {
      preview ?
        <Link to={`${appModuleUri(dashboardModules.formDesigner)}`} className="btn btn-of">
          <span className="icon icon-pencil icon-12px icon-left"/>
          Design
        </Link>
        :
        <Link to={`${appModuleUri(dashboardModules.formDesigner)}?preview=true`} className="btn btn-of">
          <span className="icon icon-eye icon-12px icon-left"/>
          Preview
        </Link>
    }
  </div>
)

export default FormEditActions
