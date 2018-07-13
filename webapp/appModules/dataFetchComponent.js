import React from 'react'

import { fetchData } from './actions'
import { connect } from 'react-redux'

class DataFetchComponent extends React.Component {

  fetchData () {
    const {fetchData, module, dashboard = false} = this.props
    fetchData(module, dashboard)
  }

  componentDidMount () {
    this.fetchData()
  }

  constructor (props, type) {
    super(props)
    this.type = type
  }

  render () {
    return this.props.children
  }
}

export default connect(null, {fetchData})(DataFetchComponent)
