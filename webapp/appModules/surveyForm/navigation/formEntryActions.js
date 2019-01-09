import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import { deleteRecord } from '../record/actions'
import { appModuleUri } from '../../appModules'
import { dashboardModules } from '../../dashboard/dashboardModules'

const FormEntryActions = ({entry, preview, deleteRecord}) => (
  entry && (
    <div className="survey-form__nav-record-actions">
      {
        !preview
          ?
          <button className="btn-s btn-of btn-danger"
                  onClick={() =>
                    window.confirm('Are you sure you want to delete this record? This operation cannot be undone')
                      ? deleteRecord()
                      : null
                  }
                  aria-disabled={false}>
            <span className="icon icon-bin icon-12px icon-left"/>
            Delete
          </button>
          :
          <Link to={appModuleUri(dashboardModules.formDesigner)} className="btn btn-of">
            <span className="icon icon-quill icon-12px icon-left"/>
            Design
          </Link>
      }
    </div>
  )
)

export default connect(null, {deleteRecord})(FormEntryActions)