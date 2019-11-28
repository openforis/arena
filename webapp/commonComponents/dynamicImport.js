import React from 'react'
import { injectReducers } from '@webapp/app/store'

export default class DynamicImport extends React.Component {
  constructor() {
    super()
    this.state = { component: null }
  }

  async componentDidMount() {
    const { load } = this.props

    const module = await load()
    const { component, reducers } = module

    if (reducers) {
      reducers.forEach(reducer => {
        injectReducers(reducer.name, reducer.fn)
      })
    }

    this.setState({
      component: component ? component : module.default,
    })
  }

  render() {
    const { component } = this.state
    const { module: _module, ...rest } = this.props
    return component ? React.createElement(component, rest) : null
  }
}
