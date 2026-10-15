import './AssistantMarkdown.scss'

import React, { useEffect, useMemo, useState } from 'react'

import {
  createManualLinks,
  hasManualReferences,
  linkManualReferences,
  type ManualLinks,
} from '@webapp/ai/help/handbookLinks'
import { loadHandbook } from '@webapp/ai/help/loadHandbook'

import { type AssistantLinkPolicy, renderAssistantMarkdown } from './assistantMarkdown'

/**
 * Loads the manual links once the text refers to the manual (null until then, or when the handbook can't be loaded).
 * @param {string} text - Markdown text.
 * @returns {ManualLinks|null} The manual links.
 */
const useManualLinks = (text: string): ManualLinks | null => {
  const [links, setLinks] = useState<ManualLinks | null>(null)
  const needed = hasManualReferences(text)
  useEffect(() => {
    if (!needed || links) return undefined
    let active = true
    loadHandbook()
      .then(({ handbook }) => {
        if (active) setLinks(createManualLinks(handbook))
      })
      .catch(() => {
        // the references stay plain text
      })
    return () => {
      active = false
    }
  }, [needed, links])
  return links
}

/**
 * The links that keep their query string: Arena itself and the manual (its document, not the whole host).
 * @param {ManualLinks|null} links - Manual links, once loaded.
 * @returns {AssistantLinkPolicy} The policy.
 */
const getLinkPolicy = (links: ManualLinks | null): AssistantLinkPolicy => ({
  trustedOrigins: [globalThis.location.origin],
  trustedPages: links ? [links.manualUrl.replace(/\/edit$/, '')] : [],
})

/**
 * Assistant answer text (Markdown rendered without remote resources; manual references linked to the manual).
 * @param {object} props - Props.
 * @param {string} props.text - Markdown text.
 * @returns {React.ReactElement} The rendered text.
 */
export const AssistantMarkdown = ({ text }: { text: string }) => {
  const links = useManualLinks(text)
  const html = useMemo(
    () => renderAssistantMarkdown(links ? linkManualReferences(text, links) : text, getLinkPolicy(links)),
    [text, links]
  )
  return <div className="ai-assistant-markdown" dangerouslySetInnerHTML={{ __html: html }} />
}
