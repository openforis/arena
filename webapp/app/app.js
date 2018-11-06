import React from 'react'

import component from './appView'

import homeReducer from '../appModules/home/reducer'
import surveyFormReducer from '../appModules/surveyForm/reducer'

const reducers = [
  {name: 'home', fn: homeReducer},
  {name: 'surveyForm', fn: surveyFormReducer},
]

export {
  component,
  reducers,
}




