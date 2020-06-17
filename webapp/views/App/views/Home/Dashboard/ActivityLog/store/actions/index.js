import { useGetActivityLogMessages } from './useGetActivityLogMessages'

export const useActions = ({ messages, setMessages }) => ({
  onGetActivityLogMessages: useGetActivityLogMessages({ messages, setMessages }),
})
