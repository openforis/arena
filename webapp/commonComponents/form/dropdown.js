import './dropdown.scss'

import React from 'react'
import ReactDOM from 'react-dom'

import * as R from 'ramda'

import { Input } from './input'
import AutocompleteDialog from './autocompleteDialog'

const dropdownListItemClassName = 'dropdown__list-item'

class Dropdown extends React.Component {

  constructor (props) {
    super(props)

    const {items, selection, autocompleteMinChars} = this.props

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
    const {items, autocompleteMinChars} = this.props
    if (prevProps.items.length !== items.length ||
      !R.equals(prevProps.items, items))
      this.setState({
        items: autocompleteMinChars > 0 ? [] : items
      })
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
    const {onChange, clearOnSelection} = this.props

    onChange(item)

    this.setState({
      selection: clearOnSelection ? null : item,
      displayValue: clearOnSelection ? '' : this.getItemLabel(item),
      opened: false,
    })
  }

  onInputChange (evt) {
    const {value = ''} = evt.target

    const {items, autocompleteMinChars} = this.props

    const contains = (a = '', b = '') => R.contains(R.toLower(a), R.toLower(b))

    const searchValue = R.trim(value)

    const filteredItems =
      autocompleteMinChars <= 0 && searchValue.length === 0 ?
        items
        : autocompleteMinChars > 0 && searchValue.length < autocompleteMinChars ?
        []
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

    this.props.onChange(null)
  }

  onInputFocus () {
    if (!this.isOpened() && !R.isEmpty(this.state.items) && this.props.selection === null) {
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
    const {itemLabelFunction, itemLabelProp} = this.props
    return this.extractValueFromFunctionOrProp(item, itemLabelFunction, itemLabelProp, 'value')
  }

  getItemKey (item) {
    const {itemKeyFunction, itemKeyProp} = this.props
    return this.extractValueFromFunctionOrProp(item, itemKeyFunction, itemKeyProp, 'key')
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
    } = this.props

    const {
      items,
      displayValue,
    } = this.state

    const DropdownItemRenderer = props => {
      const {item, ...otherProps} = props

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
             value={displayValue}
             validation={validation}
             readOnly={readOnly}
             disabled={disabled}
             onChange={e => this.onInputChange(e)}
             onFocus={e => this.onInputFocus(e)}/>

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
                                inputField={this.input.current.inputElement}
                                alignToElement={this.input.current.inputElement}
                                onItemSelect={item => this.onSelectionChange(item)}
                                onClose={() => this.toggleOpened()}/>,
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
  selection: null,
  onChange: null,
  itemKeyProp: null,
  itemKeyFunction: null,
  itemLabelProp: null,
  itemLabelFunction: null,
}

export default Dropdown