import React from 'react'

/**
 * Parse HTML tags like <strong></strong> from translation strings
 * and convert them to React elements
 */
export function parseHtmlInText(text: string): React.ReactNode {
  if (!text) return text

  // Split by <strong> and </strong> tags
  const parts = text.split(/(<strong>.*?<\/strong>)/g)

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('<strong>') && part.endsWith('</strong>')) {
          const content = part.slice(8, -9) // Remove <strong> and </strong>
          return (
            <strong key={index}>
              {content}
            </strong>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}
