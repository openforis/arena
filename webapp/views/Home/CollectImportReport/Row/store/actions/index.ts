import { useOnUpdate } from './useOnUpdate'

export const useActions = ({ rowItem, setRowItem }) => ({
  onUpdate: useOnUpdate({ rowItem, setRowItem }),
})
