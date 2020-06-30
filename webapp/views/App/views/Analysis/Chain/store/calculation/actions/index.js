import { useCreate } from './useCreate'
import { useDelete } from './useDelete'
import { useMove } from './useMove'
import { useUpdateProp } from './useUpdateProp'
import { useUpdateAttribute } from './useUpdateAttribute'
import { useSelect } from './useSelect'
import { useDismiss } from './useDismiss'

export const useActions = (dependencies) => ({
  create: useCreate(dependencies),
  select: useSelect(dependencies),
  move: useMove(dependencies),
  dismiss: useDismiss(dependencies),
  delete: useDelete(dependencies),
  updateProp: useUpdateProp(dependencies),
  updateAttribute: useUpdateAttribute(dependencies),
})
