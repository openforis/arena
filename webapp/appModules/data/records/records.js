import './records.scss'

import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import * as R from 'ramda'
import { appModuleUri } from '../../appModules'
import { dataModules } from '../dataModules'

const RecordsList = ({records}) => (
  <div className="records__list"></div>
)

class Records extends React.Component {

  render () {

    const {records} = this.props

    return (
      <div className="records table">

        <div className="table__header">
          <h5>Records</h5>
          <Link to={appModuleUri(dataModules.record)} className="btn btn-s btn-of records__btn-add-record">
            <span className="icon icon-plus icon-12px icon-left"></span>
            new
          </Link>
        </div>

        {
          R.isEmpty(records)
            ? <div className="table__empty-rows">No records added</div>
            : <RecordsList records={records}/>
        }

      </div>
    )
  }

}

const mapStateToProps = state => ({
  records: []
})

export default connect(mapStateToProps)(Records)
