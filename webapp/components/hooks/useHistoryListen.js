import { useEffect } from 'react'
import { useHistory } from 'react-router'

export const useHistoryListen = (listener, inputs = []) => {
  const history = useHistory()

  useEffect(() => {
    const unlisten = history.listen(listener)
    return () => unlisten()
  }, [...inputs, history, listener])
}
