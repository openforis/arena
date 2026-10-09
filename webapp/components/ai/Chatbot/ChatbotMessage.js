import PropTypes from 'prop-types'

import Markdown from '@webapp/components/markdown'

const ChatbotMessage = ({ role, text, streaming }) => {
  const isUser = role === 'user'
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
    </div>
  )
}

ChatbotMessage.propTypes = {
  role: PropTypes.oneOf(['user', 'assistant']).isRequired,
  text: PropTypes.string,
  streaming: PropTypes.bool,
}

export default ChatbotMessage
