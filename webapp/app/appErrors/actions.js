export const systemErrorThrow = 'system/error'
export const appErrorCreate = 'app/error/create'
export const appErrorDelete = 'app/error/delete'

export const throwSystemError = error => dispatch => dispatch({ type: systemErrorThrow, error })

export const closeAppError = error => dispatch => dispatch({ type: appErrorDelete, error })
