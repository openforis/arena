import { useCreate } from './useCreate'
import { useUpdate } from './useUpdate'
import { useUpdateProps } from './useUpdateProps'
import { useDelete } from './useDelete'
import { useDismiss } from './useDismiss'
import { useSelect } from './useSelect'

export const useActions = (dependencies) => ({
  create: useCreate(dependencies),
  update: useUpdate(dependencies),
  updateProps: useUpdateProps(dependencies),
  delete: useDelete(dependencies),
  dismiss: useDismiss(dependencies),
  select: useSelect(dependencies),
})
