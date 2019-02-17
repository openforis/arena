import React from 'react'
import axios from 'axios'
import * as R from 'ramda'

import Dropdown from '../../../form/dropdown'

const getNodeRawValue = node => node.raw ? JSON.parse(node.raw) : ''


class Literal extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      selection: null,
      items: null
    }
  }

  async componentDidMount () {
    const { literalSearchParams, node } = this.props
    if (literalSearchParams) {
      this.setState({
        selection: await this.loadItem(getNodeRawValue(node)),
        items: await this.loadItems()
      })
    }
  }

  async loadItem (value) {
    const { literalSearchParams } = this.props

    if (value) {
      const params = {
        ...literalSearchParams,
        value
      }
      const { data } = await axios.get('/api/expression/literal/item', { params })

      return data.item
    } else {
      return null
    }
  }

  async loadItems (value = '') {
    const { literalSearchParams } = this.props

    const params = {
      ...literalSearchParams,
      value
    }
    const { data } = await axios.get('/api/expression/literal/items', { params })
    return data.items
  }

  onChange (val) {
    const { node, onChange } = this.props

    const value = JSON.stringify(val)

    onChange(R.pipe(
      R.assoc('raw', value),
      R.assoc('value', value),
    )(node))
  }

  render () {
    const { node, literalSearchParams } = this.props
    const { items, selection } = this.state

    const value = getNodeRawValue(node)

    const lookupFunction = async value => this.loadItems(value)

    return (
      <div className="literal">
        {
          literalSearchParams
            ? (
              <Dropdown items={items}
                        itemsLookupFunction={lookupFunction}
                        itemKeyProp="key"
                        itemLabelProp="label"
                        onChange={item => this.onChange(item.key)}
                        selection={selection}/>
            )
            : (
              <input className="form-input" value={value}
                     size={25}
                     onChange={e => this.onChange(e.target.value)}/>
            )
        }

      </div>
    )
  }
}

Literal.defaultProps = {
  literalSearchParams: null
}

export default Literal