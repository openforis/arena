import { useGetActivityLogMessages, useGetActivityLogMessagesNext } from './useGetActivityLogMessages'

export const useActions = ({ messages, setMessages, onError }) => ({
  onGetActivityLogMessages: useGetActivityLogMessages({ messages, setMessages, onError }),
  onGetActivityLogMessagesNext: useGetActivityLogMessagesNext({ messages, setMessages, onError }),
})
