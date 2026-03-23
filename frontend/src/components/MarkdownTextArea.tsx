import { useCallback } from 'react'
import { TextArea, type TextAreaProps } from '@blueprintjs/core'
import { handlePasteAsMarkdown } from '@/utils/pasteAsMarkdown'

interface MarkdownTextAreaProps extends TextAreaProps {
  onValueChange?: (value: string) => void
}

export function MarkdownTextArea({ onValueChange, onPaste, onChange, ...props }: MarkdownTextAreaProps) {
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const md = handlePasteAsMarkdown(e)
    if (md !== null && onValueChange) {
      onValueChange(md)
      return
    }
    onPaste?.(e)
  }, [onValueChange, onPaste])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onValueChange?.(e.target.value)
    onChange?.(e)
  }, [onValueChange, onChange])

  return (
    <TextArea
      {...props}
      onChange={handleChange}
      onPaste={handlePaste}
    />
  )
}
