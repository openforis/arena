import React from 'react'
import * as R from 'ramda'
import { FormInput } from './formInputComponents'
import LanguageDropdownComponent from './languageDropdownComponent'

const initialState = {
  newLabel: '',
  newLabelLang: '',
  newLabelValidation: {},
  newLabelLangValidation: {},
}

export default class LabelsEditorComponent extends React.Component {

  constructor (props) {
    super(props)

    this.state = {...initialState}

    this.onNewLabelChange = this.onNewLabelChange.bind(this)
    this.onNewLabelLanguageChange = this.onNewLabelLanguageChange.bind(this)
    this.onAddLabelClick = this.onAddLabelClick.bind(this)
  }

  onNewLabelChange(e) {
    this.setState({
      newLabel: e.target.value,
      newLabelValidation: {}
    })
  }

  onNewLabelLanguageChange(e) {
    this.setState({
      newLabelLang: e,
      newLabelLangValidation: {}
    })
  }

  onAddLabelClick(e) {
    const {onNewLabelAdd} = this.props
    const {newLabel, newLabelLang} = this.state

    const validation = this.validateNewLabelForm()
    if (validation.valid) {
      onNewLabelAdd({lang: newLabelLang, label: newLabel})
      this.setState({
        ...initialState
      })
    } else {
      this.setState({
        newLabelValidation: validation.fields.newLabel,
        newLabelLangValidation: validation.fields.newLabelLang
      })
    }
  }

  validateNewLabelForm() {
    const {newLabel, newLabelLang} = this.state
    const validation = {}

    const newLabelValidation = validateRequired('newLabel', this.state)
    const newLabelLangValidation = validateRequired('newLabelLang', this.state)

    return R.pipe(
      R.assoc('valid', true),
      R.partial(assocValidation, ['newLabel', newLabelValidation]),
      R.partial(assocValidation, ['newLabelLang', newLabelLangValidation]),
    )(validation)
  }

  render () {
    const {languages, labels, onChange} = this.props
    const {newLabel, newLabelLang, newLabelValidation, newLabelLangValidation} = this.state

    const existingLanguagesRows = languages.map(lang => {
      const label = R.prop(lang)(labels)

      return <div key={lang} style={{
          display: 'grid',
          gridTemplateColumns: '.7 .3'
        }}>
        <FormInput value={label}
                   onChange={e => onChange({
                       lang,
                       label: e.target.value
                     }
                   )}/>
        <div>{lang}</div>
      </div>
    })

    return <div style={{
      display: 'grid',
      gridTemplateColumns: '.6 .2 .2'
    }}>
      {existingLanguagesRows}

      <FormInput value={newLabel}
                 onChange={this.onNewLabelChange}
                 validation={newLabelValidation} />

      <LanguageDropdownComponent selection={newLabelLang}
                                 onChange={this.onNewLabelLanguageChange}
                                 validation={newLabelLangValidation} />

      <button onClick={this.onAddLabelClick}>Add</button>
    </div>
  }

}

const createError = (error) => error
  ? R.pipe(
    R.assoc('valid', false),
    R.assoc('error', error),
  )({})
  : null

const validateRequired = (propName, obj) => {
  const value = R.pipe(
    R.prop(propName),
    R.defaultTo(''),
    R.trim,
  )(obj)

  const error = R.isEmpty(value)
    ? 'empty'
    : null

  return createError(error)
}

const assocValidation = (name, validation, obj) => R.propEq('valid', false, validation ? validation : {})
  ? R.pipe(
    R.assoc('valid', false),
    R.assocPath(['fields', name], validation),
  )(obj)
  : obj