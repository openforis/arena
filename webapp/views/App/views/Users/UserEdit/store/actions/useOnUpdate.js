import { useCallback } from 'react'

import { validateUserEdit } from './validate'

export const useOnUpdate = ({ setUserToUpdate }) =>
  useCallback(async (userUpdated) => {
    const userUpdatedValidated = await validateUserEdit(userUpdated)
    setUserToUpdate(userUpdatedValidated)
  }, [])
