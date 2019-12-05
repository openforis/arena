import { useStore } from 'react-redux'

export default () => {
  const store = useStore()
  return store.getState()
}
