import './dropdown.scss'

import React from 'react'
import ReactDOM from 'react-dom'

import * as R from 'ramda'

import { contains, trim } from '@core/stringUtils'
import { Input } from './input'
import AutocompleteDialog from './autocompleteDialog'

const dropdownListItemClassName = 'dropdown__list-item'

class Dropdown extends React.Component {
  constructor(props) {
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
  }

  componentDidUpdate(prevProps) {
    const { items, selection, autocompleteMinChars } = this.props
    const { items: prevItems, selection: prevSelection } = prevProps

    if (!R.equals(prevItems, items)) {
      this.setState({
        displayValue: this.getItemLabel(selection),
        items: autocompleteMinChars > 0 ? [] : items,
      })
    }

    if (!R.equals(selection, prevSelection)) {
      const displayValue = selection ? this.getItemLabel(selection) : null

      this.setState({ displayValue })
    }
  }

  toggleOpened(callback = null) {
    if (!(this.props.readOnly || this.props.disabled)) {
      this.setState(
        {
          opened: !this.state.opened,
        },
        callback,
      )
    }
  }

  isOpened() {
    return this.state.opened
  }

  onSelectionChange(item) {
    const { onChange, clearOnSelection, itemsLookupFunction } = this.props
    const { items } = this.state

    onChange(item)

    this.setState({
      displayValue: clearOnSelection ? '' : this.getItemLabel(item),
      items: itemsLookupFunction ? [] : items,
      opened: false,
    })
  }

  async onInputChange(value = '') {
    const { items, autocompleteMinChars, itemsLookupFunction, onChange } = this.props

    const searchValue = R.trim(value)

    const filteredItems =
      autocompleteMinChars <= 0 && searchValue.length === 0
        ? items
        : autocompleteMinChars > 0 && searchValue.length < autocompleteMinChars
        ? []
        : itemsLookupFunction
        ? await itemsLookupFunction(searchValue)
        : items.filter(item => {
            if (R.is(Object)(item)) {
              const key = this.getItemKey(item)
              const label = this.getItemLabel(item)
              return contains(searchValue, key) || contains(searchValue, label)
            }

            return contains(searchValue, item)
          })

    this.setState({
      items: filteredItems,
      displayValue: value,
      opened: true,
    })

    onChange(null)
  }

  onInputFocus() {
    if (!this.isOpened() && !R.isEmpty(this.state.items)) {
      this.toggleOpened()
    }
  }

  onBlur(e) {
    const itemFocused = R.prop('className')(e.relatedTarget) === dropdownListItemClassName
    if (this.isOpened() && !itemFocused) {
      this.toggleOpened()
    }
  }

  getItemLabel(item = '') {
    const { itemLabelFunction, itemLabelProp } = this.props
    return R.defaultTo('', this.extractValueFromFunctionOrProp(item, itemLabelFunction, itemLabelProp, 'value'))
  }

  getItemKey(item) {
    const { itemKeyFunction, itemKeyProp } = this.props
    return this.extractValueFromFunctionOrProp(item, itemKeyFunction, itemKeyProp, 'key')
  }

  getInputField() {
    return this.input.current
  }

  extractValueFromFunctionOrProp(item, func, prop, defaultProp) {
    return R.isNil(item)
      ? null
      : func
      ? func(item)
      : R.is(Object, item)
      ? prop
        ? R.prop(prop)(item)
        : R.has(defaultProp)(item)
        ? R.prop(defaultProp)(item)
        : item
      : item // Primitive
  }

  render() {
    const {
      placeholder,
      className = '',
      style = {},
      validation = {},
      readOnly,
      readOnlyInput,
      disabled,
      autocompleteDialogClassName,
      sourceElement,
    } = this.props

    const { items, displayValue } = this.state

    const DropdownItemRenderer = props => {
      const { item, ...otherProps } = props

      return (
        <div {...otherProps} className={dropdownListItemClassName}>
          {this.getItemLabel(item)}
        </div>
      )
    }

    return (
      <div ref={this.dropdown} className={`dropdown ${className}`} style={style} onBlur={e => this.onBlur(e)}>
        <Input
          ref={this.input}
          placeholder={placeholder}
          value={trim(displayValue)}
          validation={validation}
          readOnly={readOnly || readOnlyInput}
          disabled={disabled}
          onChange={value => this.onInputChange(value)}
          onFocus={e => this.onInputFocus(e)}
        />

        <span
          className="icon icon-play3 icon-12px"
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            this.toggleOpened()
          }}
          aria-disabled={disabled}
        />
        {this.isOpened()
          ? ReactDOM.createPortal(
              <AutocompleteDialog
                items={items}
                itemRenderer={DropdownItemRenderer}
                itemKeyFunction={item => this.getItemKey(item)}
                inputField={this.getInputField()}
                sourceElement={sourceElement || this.dropdown.current}
                onItemSelect={item => this.onSelectionChange(item)}
                onClose={() => this.toggleOpened()}
                className={autocompleteDialogClassName}
              />,
              document.body,
            )
          : null}
      </div>
    )
  }
}

Dropdown.defaultProps = {
  clearOnSelection: false,
  autocompleteMinChars: 0,
  readOnly: false,
  readOnlyInput: false,
  disabled: false,
  items: [],
  itemsLookupFunction: null,
  selection: null,
  onChange: null,
  itemKeyProp: null,
  itemKeyFunction: null,
  itemLabelProp: null,
  itemLabelFunction: null,
  autocompleteDialogClassName: null,
  sourceElement: null, // Used to calculate the size of the autocomplete-dialog if available, otherwise the this.dropdown.current is used
}

export default Dropdown
