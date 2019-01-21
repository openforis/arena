import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import { deleteRecord } from '../record/actions'
import { appModuleUri } from '../../appModules'
import { designerModules } from '../../designer/designerModules'

const FormEntryActions = ({entry, preview, deleteRecord, history}) => (
  entry && (
    <div className="survey-form__nav-record-actions">
      {
        !preview
          ?
          <button className="btn-s btn-of btn-danger"
                  onClick={() =>
                    window.confirm('Are you sure you want to delete this record? This operation cannot be undone')
                      ? deleteRecord(history)
                      : null
                  }
                  aria-disabled={false}>
            <span className="icon icon-bin icon-12px icon-left"/>
            Delete
          </button>
          :
          <Link to={appModuleUri(designerModules.formDesigner)} className="btn btn-of">
            <span className="icon icon-eye-blocked icon-12px icon-left"/>
            Close preview
          </Link>
      }
    </div>
  )
)

export default connect(null, {deleteRecord})(FormEntryActions)