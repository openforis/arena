import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import { deleteRecord, promoteRecord, demoteRecord } from '../record/actions'
import { appModuleUri } from '../../appModules'
import { designerModules } from '../../designer/designerModules'

const RecordEntryButtons = ({ deleteRecord, promoteRecord, demoteRecord, history }) => (
  <React.Fragment>
    <button className="btn-s btn-of btn-transparent"
            style={{ marginRight: 5 }}
            onClick={() =>
              window.confirm('Are sure you want to demote this record? You won\'t be able to edit it anymore')
                ? demoteRecord(history)
                : null}>
      <span className="icon icon-point-left icon-16px"/>
    </button>

    Step 1

    <button className="btn-s btn-of btn-transparent"
            style={{ marginLeft: 5 }}
            onClick={() =>
              window.confirm('Are sure you want to promote this record? You won\'t be able to edit it anymore')
                ? promoteRecord(history)
                : null}>
      <span className="icon icon-point-right icon-16px"/>
    </button>

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
  </React.Fragment>
)

const FormEntryActions = ({ entry, preview, deleteRecord, promoteRecord, demoteRecord, history }) =>
  entry &&
  <div className="survey-form__nav-record-actions">
    {
      preview
        ? (
          <Link to={appModuleUri(designerModules.formDesigner)} className="btn btn-of">
            <span className="icon icon-eye-blocked icon-12px icon-left"/>
            Close preview
          </Link>
        ) :
        (
          <RecordEntryButtons history={history} deleteRecord={deleteRecord} promoteRecord={promoteRecord} demoteRecord={demoteRecord}/>
        )
    }
  </div>

export default connect(null, { deleteRecord, promoteRecord, demoteRecord })(FormEntryActions)