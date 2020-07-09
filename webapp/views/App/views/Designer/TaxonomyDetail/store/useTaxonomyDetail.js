import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useActions } from './actions'
import * as TaxonomyActions from '../actions'

export const useTaxonomyDetail = (props) => {
  const { onTaxonomyCreate } = props
  const dispatch = useDispatch()
  const [state, setState] = useState({})

  const Actions = useActions({ setState })

  useEffect(() => {
    Actions.init({ state, onTaxonomyCreate })
    return () => dispatch(TaxonomyActions.setTaxonomyForEdit(null))
  }, [])

  return { state, Actions }
}
