import { useSelector } from 'react-redux'
import { MessageState } from './state'

export const useMessage = () => useSelector((state) => MessageState.getMessage(state))
