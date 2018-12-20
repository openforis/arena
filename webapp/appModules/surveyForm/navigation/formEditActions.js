import React from 'react'
import { appModules, appModuleUri } from '../../appModules'
import { Link } from 'react-router-dom'
import { dataModules } from '../../data/dataModules'

const FormEditActions = () => (
  <div className="survey-form__nav-record-actions">
    <Link to={`${appModuleUri(dataModules.record)}preview`} className="btn btn-of">
      <span className="icon icon-eye icon-12px icon-left"/>
      Preview
    </Link>
  </div>
)

export default FormEditActions
