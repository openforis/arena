import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useActions } from './actions'
import * as TaxonomyActions from '../actions'

export const useTaxonomyDetails = (props) => {
  const { onTaxonomyCreated } = props
  const dispatch = useDispatch()
  const [state, setState] = useState({})

  const Actions = useActions({ setState })

  useEffect(() => {
    Actions.init({ state, onTaxonomyCreated })
    return () => dispatch(TaxonomyActions.setTaxonomyForEdit(null))
  }, [])

  return { state, Actions }
}
