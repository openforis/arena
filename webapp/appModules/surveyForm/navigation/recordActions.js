import React from 'react'

const RecordActions = ({entry}) => (
  entry
    ? (
      <div className="survey-form__nav-record-actions">
        <button className="btn-s btn-of btn-danger"
                onClick={() =>
                  window.confirm('Are you sure you want to delete this record? This operation cannot be undone')
                    ? null
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

export default RecordActions