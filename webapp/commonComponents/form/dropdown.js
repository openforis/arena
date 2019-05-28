import './dropdown.scss'

import React from 'react'
import ReactDOM from 'react-dom'

import * as R from 'ramda'

import { Input } from './input'
import AutocompleteDialog from './autocompleteDialog'

import { contains, trim } from '../../../common/stringUtils'

const dropdownListItemClassName = 'dropdown__list-item'

class Dropdown extends React.Component {

  constructor (props) {
    super(props)

    const { items, selection, autocompleteMinChars } = this.props

    this.state = {
      items: autocompleteMinChars > 0 ? [] : items,
      displayValue: this.getItemLabel(selection),
      opened: false,
    }

    this.onSelectionChange = this.onSelectionChange.bind(this)

    this.dropdown = React.createRef()
    this.input = React.createRef()
    this.dropdownList = React.createRef()
  }

  componentDidUpdate (prevProps) {
    const { items, selection, autocompleteMinChars } = this.props
    const { items: prevItems, selection: prevSelection } = prevProps

    if (!R.equals(prevItems, items)) {
      this.setState({
        displayValue: this.getItemLabel(selection),
        items: autocompleteMinChars > 0 ? [] : items,
      })
    }

    if (!R.equals(selection, prevSelection)) {
      const displayValue = selection
        ? this.getItemLabel(selection)
        : null

      this.setState({ displayValue })
    }
  }

  toggleOpened (callback = null) {
    if (!(this.props.readOnly || this.props.disabled)) {
      this.setState({
        opened: !this.state.opened,
      }, callback)
    }
  }

  isOpened () {
    return this.state.opened
  }

  onSelectionChange (item) {
    const { onChange, clearOnSelection, itemsLookupFunction } = this.props
    const { items } = this.state

    onChange(item)

    this.setState({
      displayValue: clearOnSelection ? '' : this.getItemLabel(item),
      items: itemsLookupFunction ? [] : items,
      opened: false,
    })
  }

  async onInputChange (value = '') {
    const { items, autocompleteMinChars, itemsLookupFunction, onChange } = this.props

    const searchValue = R.trim(value)

    const filteredItems =
      autocompleteMinChars <= 0 && searchValue.length === 0 ?
        items
        : autocompleteMinChars > 0 && searchValue.length < autocompleteMinChars ?
        []
        : itemsLookupFunction ?
          await itemsLookupFunction(searchValue)
          : items.filter(item => {
              if (R.is(Object)(item)) {
                const key = this.getItemKey(item)
                const label = this.getItemLabel(item)
                return contains(searchValue, key)
                  || contains(searchValue, label)
              } else {
                return contains(searchValue, item)
              }
            }
          )

    this.setState({
      items: filteredItems,
      displayValue: value,
      opened: true,
    })

    onChange(null)
  }

  onInputFocus () {
    if (!this.isOpened() && !R.isEmpty(this.state.items)) {
      this.toggleOpened()
    }
  }

  onBlur (e) {
    const itemFocused = R.prop('className')(e.relatedTarget) === dropdownListItemClassName
    if (this.isOpened() && !itemFocused) {
      this.toggleOpened()
    }
  }

  getItemLabel (item = '') {
    const { itemLabelFunction, itemLabelProp } = this.props
    return R.defaultTo('', this.extractValueFromFunctionOrProp(item, itemLabelFunction, itemLabelProp, 'value'))
  }

  getItemKey (item) {
    const { itemKeyFunction, itemKeyProp } = this.props
    return this.extractValueFromFunctionOrProp(item, itemKeyFunction, itemKeyProp, 'key')
  }

  getInputField () {
    return this.input.current.component.input
  }

  extractValueFromFunctionOrProp (item, func, prop, defaultProp) {
    return R.is(Object, item) ?
      func ?
        func(item)
        : prop ?
        R.prop(prop)(item)
        : R.has(defaultProp)(item) ?
          R.prop(defaultProp)(item)
          : item
      : item //primitive
  }

  render () {
    const {
      placeholder,
      className = '',
      style = {},
      validation = {},
      readOnly,
      disabled,
      inputSize,
      autocompleteDialogClassName,
    } = this.props

    const {
      items,
      displayValue,
    } = this.state

    const DropdownItemRenderer = props => {
      const { item, ...otherProps } = props

      return <div {...otherProps}
                  className={dropdownListItemClassName}>
        {this.getItemLabel(item)}
      </div>
    }

    return <div ref={this.dropdown}
                className={`dropdown ${className}`}
                style={style}
                onBlur={e => this.onBlur(e)}>
      <Input ref={this.input}
             placeholder={placeholder}
             value={trim(displayValue)}
             validation={validation}
             readOnly={readOnly}
             disabled={disabled}
             onChange={value => this.onInputChange(value)}
             onFocus={e => this.onInputFocus(e)}
             size={inputSize}/>

      <span className="icon icon-menu2 icon-24px"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              this.toggleOpened()
            }}
            aria-disabled={disabled}/>
      {
        this.isOpened() ?
          ReactDOM.createPortal(
            <AutocompleteDialog ref={this.dropdownList}
                                items={items}
                                itemRenderer={DropdownItemRenderer}
                                itemKeyFunction={item => this.getItemKey(item)}
                                inputField={this.getInputField()}
                                onItemSelect={item => this.onSelectionChange(item)}
                                onClose={() => this.toggleOpened()}
                                className={autocompleteDialogClassName}/>,
            document.body
          )
          : null

      }
    </div>
  }
}

Dropdown.defaultProps = {
  clearOnSelection: false,
  autocompleteMinChars: 0,
  readOnly: false,
  disabled: false,
  items: [],
  itemsLookupFunction: null,
  selection: null,
  onChange: null,
  itemKeyProp: null,
  itemKeyFunction: null,
  itemLabelProp: null,
  itemLabelFunction: null,
  inputSize: 20,
  autocompleteDialogClassName: null,
}

export default Dropdown