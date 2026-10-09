import React from 'react'

import Markdown from '@webapp/components/markdown'

// the markdown parser fails on an empty string: a space while the first chunk is on its way
/**
 * Assistant answer text (sanitized markdown).
 * @param {object} props - Props.
 * @param {string} props.text - Markdown text.
 * @returns {React.ReactElement} The rendered text.
 */
export const AssistantMarkdown = ({ text }: { text: string }) => (
  <Markdown className="ai-assistant-markdown" source={text || ' '} />
)
