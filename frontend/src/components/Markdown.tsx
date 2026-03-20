import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

const components: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="mb-0.5">{children}</li>,
  code: ({ className, children, ...props }) => {
    const isBlock = className?.includes('language-')
    if (isBlock) {
      return (
        <code
          className={`block bg-black/20 rounded-md px-3 py-2 my-2 text-xs font-mono overflow-x-auto whitespace-pre ${className ?? ''}`}
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code className="bg-black/20 rounded px-1 py-0.5 text-xs font-mono" {...props}>
        {children}
      </code>
    )
  },
  pre: ({ children }) => <pre className="mb-2 last:mb-0">{children}</pre>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-odi-accent/50 pl-3 my-2 text-odi-text-muted italic">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-odi-accent underline underline-offset-2">
      {children}
    </a>
  ),
  h1: ({ children }) => <h1 className="text-base font-bold mb-1">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-bold mb-1">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="text-xs border-collapse w-full">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-odi-border px-2 py-1 text-left font-semibold bg-black/10">{children}</th>,
  td: ({ children }) => <td className="border border-odi-border px-2 py-1">{children}</td>,
  hr: () => <hr className="border-odi-border my-2" />,
}

interface MarkdownProps {
  children: string
  className?: string
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
