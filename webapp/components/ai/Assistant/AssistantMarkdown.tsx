import React, { useMemo } from 'react'

import { renderAssistantMarkdown } from './assistantMarkdown'

/**
 * Assistant answer text (Markdown rendered without remote resources).
 * @param {object} props - Props.
 * @param {string} props.text - Markdown text.
 * @returns {React.ReactElement} The rendered text.
 */
export const AssistantMarkdown = ({ text }: { text: string }) => {
  const html = useMemo(() => renderAssistantMarkdown(text), [text])
  return <div className="ai-assistant-markdown" dangerouslySetInnerHTML={{ __html: html }} />
}
