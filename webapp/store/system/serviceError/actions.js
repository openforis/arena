export const serviceErrorCreate = 'service/error/create'
export const serviceErrorDelete = 'service/error/delete'

export const closeAppError = (error) => (dispatch) => dispatch({ type: serviceErrorDelete, error })
