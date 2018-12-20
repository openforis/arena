import React from 'react'
import { connect } from 'react-redux'

import { deleteRecord } from '../record/actions'

const FormEntryActions = ({entry, deleteRecord}) => (
  entry
    ? (
      <div className="survey-form__nav-record-actions">
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
      </div>
    )
    : null
)

export default connect(null, {deleteRecord})(FormEntryActions)