import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

const RecordsList = ({records}) => (
  <div className="records__list"></div>
)

class Records extends React.Component {

  render () {

    const {records} = this.props

    return (
      <div className="records">

        <div className="records__header">
          Records
        </div>

        {
          R.isEmpty(records)
            ? <div className="records__empty">No records added</div>
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
