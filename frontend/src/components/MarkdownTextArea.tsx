import { useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { handlePasteAsMarkdown } from '@/utils/pasteAsMarkdown'

interface MarkdownTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onValueChange?: (value: string) => void
  fill?: boolean
}

export function MarkdownTextArea({ onValueChange, onPaste, onChange, fill, className, ...props }: MarkdownTextAreaProps) {
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
    <Textarea
      {...props}
      className={`${fill ? 'w-full' : ''} ${className ?? ''}`}
      onChange={handleChange}
      onPaste={handlePaste}
    />
  )
}
