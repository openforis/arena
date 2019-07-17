import React from 'react'
import axios from 'axios'
import * as R from 'ramda'

import NodeDef from '../../../../common/survey/nodeDef'
import StringUtils from '../../../../common/stringUtils'

import Dropdown from '../../form/dropdown'

class Literal extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      selection: null,
      items: null
    }
  }

  getSearchParams () {
    return this.props.literalSearchParams
  }

  hasSearchParams () {
    return !!this.getSearchParams()
  }

  isValueText (value) {
    const { nodeDefCurrent } = this.props
    return nodeDefCurrent
      ? !(NodeDef.isInteger(nodeDefCurrent) || NodeDef.isDecimal(nodeDefCurrent) || StringUtils.isBlank(value))
      : false
  }

  getNodeValue () {
    const rawValue = R.pathOr(null, ['node', 'raw'], this.props)

    return this.isValueText(rawValue)
      ? JSON.parse(rawValue)
      : rawValue
  }

  async componentDidMount () {
    if (this.hasSearchParams()) {

      const [selection, items] = await Promise.all([
        this.loadItem(),
        this.loadItems()
      ])

      this.setState({ selection, items })
    }
  }

  async loadItem () {
    const value = this.getNodeValue()

    if (value) {
      const params = {
        ...this.getSearchParams(),
        value
      }
      const { data } = await axios.get('/api/expression/literal/item', { params })

      return data.item
    } else {
      return null
    }
  }

  async loadItems (value = '') {
    const params = {
      ...this.getSearchParams(),
      value
    }
    const { data } = await axios.get('/api/expression/literal/items', { params })
    return data.items
  }

  onChange (val) {
    const { node, onChange } = this.props

    const value = this.isValueText(val)
      ? JSON.stringify(val)
      : val

    onChange(R.pipe(
      R.assoc('raw', value),
      R.assoc('value', value),
    )(node))
  }

  render () {
    const { items, selection } = this.state

    return (
      <div className="literal">
        {

          this.hasSearchParams()
            ? (
              <Dropdown
                items={items}
                itemsLookupFunction={this.loadItems.bind(this)}
                itemKeyProp="key"
                itemLabelProp="label"
                onChange={item => item && this.onChange(item.key)}
                selection={selection}
              />
            )
            : (
              <input
                className="form-input"
                value={this.getNodeValue()}
                size={25}
                onChange={e => this.onChange(e.target.value)}
              />
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