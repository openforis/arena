import { Remarkable } from 'remarkable'

const markdownToHTML = new Remarkable()
const markdownToText = new Remarkable({ html: false })

export const renderMarkdownAsHTML = md => markdownToHTML.render(md)
export const renderMarkdownAsText = md => markdownToText.render(md)
export const i18nMarkdownToText = (i18n, key, params) => renderMarkdownAsText( i18n.t(key, params) )
