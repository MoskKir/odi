import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
})

turndown.use(gfm)

/**
 * Handles paste event: if clipboard contains HTML, converts it to markdown
 * and inserts at cursor position. Returns the new full text value,
 * or null if no HTML was found (let browser handle plain text paste).
 */
export function handlePasteAsMarkdown(
  e: React.ClipboardEvent<HTMLTextAreaElement>,
): string | null {
  const html = e.clipboardData.getData('text/html')
  if (!html) return null

  e.preventDefault()

  const md = turndown.turndown(html).trim()
  const textarea = e.currentTarget
  const { selectionStart, selectionEnd, value } = textarea

  const before = value.slice(0, selectionStart)
  const after = value.slice(selectionEnd)
  const newValue = before + md + after

  // Restore cursor position after React re-render
  requestAnimationFrame(() => {
    textarea.selectionStart = textarea.selectionEnd = selectionStart + md.length
  })

  return newValue
}
