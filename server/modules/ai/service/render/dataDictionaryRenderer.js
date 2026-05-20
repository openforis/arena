/**
 * Renders an Arena data dictionary (the survey's node-def schema with
 * AI-filled descriptions) into either Markdown or self-contained HTML.
 * No third-party templating dependency — the surface is small enough
 * that string templates are clearer.
 */

const escapeHtml = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/**
 * Renders the dictionary as Markdown.
 * @param {object} args - Args.
 * @param {string} args.surveyName - Survey display name.
 * @param {string} args.lang - Language code used for labels.
 * @param {Array<{name:string, type:string, label:string, description:string, parentPath:string, aiGenerated: boolean}>} args.entries - Node-def rows.
 * @returns {string} Markdown source.
 */
export const renderMarkdown = ({ surveyName, lang, entries }) => {
  const head = `# Data Dictionary — ${surveyName}\n\nLanguage: ${lang}\nGenerated: ${new Date().toISOString()}\n\n`
  const tableHead = '| Path | Name | Type | Label | Description |\n' + '|---|---|---|---|---|\n'
  const rows = entries
    .map((e) => {
      const desc = (e.description || '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
      const aiSuffix = e.aiGenerated ? ' _(AI)_' : ''
      return `| ${e.parentPath || '-'} | \`${e.name}\` | ${e.type} | ${e.label || ''} | ${desc}${aiSuffix} |`
    })
    .join('\n')
  return head + tableHead + rows + '\n'
}

/**
 * Renders the dictionary as a self-contained HTML page.
 * @param {object} args - Args (same shape as renderMarkdown).
 * @param args.surveyName
 * @param args.lang
 * @param args.entries
 * @returns {string} HTML source.
 */
export const renderHtml = ({ surveyName, lang, entries }) => {
  const rows = entries
    .map((e) => {
      const aiSuffix = e.aiGenerated ? ' <span class="ai-flag" title="AI-generated">AI</span>' : ''
      return (
        `<tr>` +
        `<td>${escapeHtml(e.parentPath || '-')}</td>` +
        `<td><code>${escapeHtml(e.name)}</code></td>` +
        `<td>${escapeHtml(e.type)}</td>` +
        `<td>${escapeHtml(e.label || '')}</td>` +
        `<td>${escapeHtml(e.description || '')}${aiSuffix}</td>` +
        `</tr>`
      )
    })
    .join('\n')
  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<title>Data Dictionary — ${escapeHtml(surveyName)}</title>
<style>
  body { font-family: -apple-system, Segoe UI, sans-serif; margin: 2rem; color: #222; }
  h1 { border-bottom: 2px solid #2e7d32; padding-bottom: 0.3rem; }
  .meta { color: #666; font-size: 0.9rem; margin-bottom: 1rem; }
  table { border-collapse: collapse; width: 100%; font-size: 0.9rem; }
  th, td { border: 1px solid #ccc; padding: 0.4rem 0.6rem; text-align: left; vertical-align: top; }
  th { background: #f5f5f5; }
  code { background: #f5f5f5; padding: 0.1rem 0.3rem; border-radius: 3px; font-size: 0.85rem; }
  .ai-flag { background: #fff3cd; color: #8a6d3b; border-radius: 3px; padding: 0 0.3rem; font-size: 0.75rem; margin-left: 0.3rem; }
</style>
</head>
<body>
<h1>Data Dictionary — ${escapeHtml(surveyName)}</h1>
<div class="meta">Language: ${escapeHtml(lang)} · Generated: ${new Date().toISOString()}</div>
<table>
<thead>
  <tr><th>Path</th><th>Name</th><th>Type</th><th>Label</th><th>Description</th></tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
</body>
</html>
`
}
