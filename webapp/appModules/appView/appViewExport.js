import React from 'react'

import component from './appView'

import homeReducer from '../home/reducer'
import surveyFormReducer from '../surveyForm/reducer'
import dataReducer from '../data/reducer'

const reducers = [
  {name: 'home', fn: homeReducer},
  {name: 'surveyForm', fn: surveyFormReducer},
  {name: 'data', fn: dataReducer},
]

export {
  component,
  reducers,
}




