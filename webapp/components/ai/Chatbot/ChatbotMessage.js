import PropTypes from 'prop-types'

import Markdown from '@webapp/components/markdown'
import { useI18n } from '@webapp/store/system'

const ChatbotMessage = ({ role, text, reasoning, streaming }) => {
  const i18n = useI18n()
  const isUser = role === 'user'
  const hasReasoning = !isUser && typeof reasoning === 'string' && reasoning.length > 0
  const bubbleClass = `ai-chatbot-message__bubble${streaming ? ' ai-chatbot-message__cursor' : ''}`

  return (
    <div className={`ai-chatbot-message ai-chatbot-message--${isUser ? 'user' : 'assistant'}`}>
      {isUser ? (
        <div className={bubbleClass}>{text || ' '}</div>
      ) : (
        // marked crashes on an empty string; substitute a space while
        // the first chunk is still on the wire.
        <Markdown className={bubbleClass} source={text || ' '} />
      )}
      {hasReasoning ? (
        <details className="ai-chatbot-message__reasoning">
          <summary>{i18n.t('aiChatbot.showReasoning')}</summary>
          <div className="ai-chatbot-message__reasoning-content">{reasoning}</div>
        </details>
      ) : null}
    </div>
  )
}

ChatbotMessage.propTypes = {
  role: PropTypes.oneOf(['user', 'assistant']).isRequired,
  text: PropTypes.string,
  reasoning: PropTypes.string,
  streaming: PropTypes.bool,
}

export default ChatbotMessage
