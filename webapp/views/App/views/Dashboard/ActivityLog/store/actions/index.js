import { useGetActivityLogMessages, useGetActivityLogMessagesNext } from './useGetActivityLogMessages'

export const useActions = ({ messages, setMessages }) => ({
  onGetActivityLogMessages: useGetActivityLogMessages({ messages, setMessages }),
  onGetActivityLogMessagesNext: useGetActivityLogMessagesNext({ messages, setMessages }),
})
