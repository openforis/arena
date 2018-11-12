import React from 'react'

import component from './appView'

import homeReducer from '../home/reducer'
import surveyFormReducer from '../surveyForm/reducer'

const reducers = [
  {name: 'home', fn: homeReducer},
  {name: 'surveyForm', fn: surveyFormReducer},
]

export {
  component,
  reducers,
}




