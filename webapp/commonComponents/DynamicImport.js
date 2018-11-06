import React from 'react'
import { injectReducers } from '../store'

export default class DynamicImport extends React.Component {

  constructor () {
    super()
    this.state = {component: null}
  }

  componentWillMount () {
    const {load} = this.props

    load().then((module) => {
      const {component, reducers} = module

      if (reducers) {
        reducers.forEach((reducer) => {
          injectReducers(reducer.name, reducer.fn)
        })
      }

      this.setState({
        component: (component) ? component : module.default
      })

    })
  }

  render () {
    return this.props.children(this.state.component)
  }
}
