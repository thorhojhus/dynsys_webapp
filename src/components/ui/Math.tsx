import TeX from '@matejmazur/react-katex';
import { useMemo } from 'react';

interface MathProps {
  children: string;
  block?: boolean;
  className?: string;
}

export function Math({ children, block = false, className = '' }: MathProps) {
  return (
    <TeX
      math={children}
      block={block}
      className={className}
      settings={{
        throwOnError: false,
        errorColor: '#ef4444',
      }}
    />
  );
}

interface MathTextProps {
  content: string;
  className?: string;
}

interface ParsedPart {
  type: 'text' | 'math';
  content: string;
  block: boolean;
}

function parseLatexContent(content: string): ParsedPart[] {
  const parts: ParsedPart[] = [];
  let remaining = content;
  let lastIndex = 0;

  // Match both $$...$$ (block) and $...$ (inline)
  const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
        block: false,
      });
    }

    const mathContent = match[0];
    const isBlock = mathContent.startsWith('$$');
    const inner = isBlock
      ? mathContent.slice(2, -2).trim()
      : mathContent.slice(1, -1).trim();

    parts.push({
      type: 'math',
      content: inner,
      block: isBlock,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex),
      block: false,
    });
  }

  return parts;
}

export function MathText({ content, className = '' }: MathTextProps) {
  const parts = useMemo(() => parseLatexContent(content), [content]);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.type === 'math' ? (
          <Math key={i} block={part.block}>
            {part.content}
          </Math>
        ) : (
          <span key={i}>{part.content}</span>
        )
      )}
    </span>
  );
}
