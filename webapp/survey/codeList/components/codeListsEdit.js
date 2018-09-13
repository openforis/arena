import React from 'react'
import { getSurvey } from '../../surveyState'
import connect from 'react-redux/es/connect/connect'
import * as R from 'ramda'

class CodeListsEdit extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      codeLists: []
    }
  }

  componentDidMount () {
    const {survey} = this.props


  }


  addCodeList () {

  }

  render () {
    return <div style={{
      display: 'flex',
      justifyContent: 'center',
    }}>

      <label>Code lists</label>

      <button className="btn btn-s btn-of-light-xs"
              style={{marginLeft: '50px'}}
              onClick={() => this.addCodeList()}>
        <span className="icon icon-plus icon-16px icon-left" />
        ADD
      </button>

    </div>
  }
}

const mapStateToProps = state => ({
  survey: getSurvey(state)
})

export default connect(mapStateToProps)(CodeListsEdit)