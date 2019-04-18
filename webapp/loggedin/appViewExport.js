import React from 'react'

import component from './appView'

import homeReducer from './modules/home/reducer'
import surveyFormReducer from './surveyViews/surveyForm/reducer'
import dataReducer from './modules/data/reducer'

const reducers = [
  {name: 'home', fn: homeReducer},
  {name: 'surveyForm', fn: surveyFormReducer},
  {name: 'data', fn: dataReducer},
]

export {
  component,
  reducers,
}




