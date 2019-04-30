import React from 'react'

import component from './appView'

import homeReducer from './modules/home/reducer'
import surveyViewsReducer from './surveyViews/reducer'
import dataReducer from './modules/data/reducer'

const reducers = [
  {name: 'home', fn: homeReducer},
  {name: 'surveyViews', fn: surveyViewsReducer},
  {name: 'data', fn: dataReducer},
]

export {
  component,
  reducers,
}




