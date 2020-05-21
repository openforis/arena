import './dataVisView.scss'
import React from 'react'
import { useDispatch } from 'react-redux'

import { useOnSurveyCycleUpdate } from '@webapp/commonComponents/hooks'

import DataQueryView from './dataQuery'

import { resetDataVis } from './actions'

const DataVisView = () => {
  const dispatch = useDispatch()
  useOnSurveyCycleUpdate(() => dispatch(resetDataVis()))

  return (
    <div className="data-vis">
      <DataQueryView />
    </div>
  )
}

export default DataVisView
