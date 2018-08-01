import axios from 'axios'

export const nodeDefFetch = 'nodeDef/fetch'

export const fetchNodeDef = (id, draft = false) => async dispatch => {

  try {
    const {data} = await axios.get(`/api/nodeDef/${id}?draft=${draft}`)
    dispatch({type: nodeDefFetch, ...data})

  } catch (e) { }

}

