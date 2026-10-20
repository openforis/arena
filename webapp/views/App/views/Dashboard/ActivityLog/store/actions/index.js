import { useGetActivityLogMessages, useGetActivityLogMessagesNext } from './useGetActivityLogMessages'

export const useActions = ({ messages, setMessages, onError, onLoaded }) => ({
  onGetActivityLogMessages: useGetActivityLogMessages({ messages, setMessages, onError, onLoaded }),
  onGetActivityLogMessagesNext: useGetActivityLogMessagesNext({ messages, setMessages, onError, onLoaded }),
})
