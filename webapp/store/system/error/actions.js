export const SYSTEM_ERROR_THROW = 'system/error/throw'

export const throwSystemError = ({ error }) => ({ type: SYSTEM_ERROR_THROW, error })
