import { useUpdateSelection } from './useUpdateSelection'

export const useActions = ({ onBeforeChange, onChange, setOpened }) => ({
  updateSelection: useUpdateSelection({ onBeforeChange, onChange, setOpened }),
})
