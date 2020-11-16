import { validateUserEdit } from './validate'

export const useOnUpdate = ({ setUserToUpdate }) => {
  return (userUpdated) => {
    ;(async () => {
      const userUpdatedValidated = await validateUserEdit(userUpdated)
      setUserToUpdate(userUpdatedValidated)
    })()
  }
}
