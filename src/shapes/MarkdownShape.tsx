import React, { useCallback, useEffect, useState } from 'react';
import {
  BaseBoxShapeUtil,
  HTMLContainer,
  RecordProps,
  T,
  TLBaseShape,
  stopEventPropagation
} from '@tldraw/tldraw';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Utility function to extract code blocks from markdown
const extractCodeBlocks = (text: string) => {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const blocks: { language: string; code: string }[] = [];
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim()
    });
  }

  return blocks;
};

// Format a date nicely
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Define the markdown shape type
type MarkdownShape = TLBaseShape<
  'markdown',
  {
    w: number;
    h: number;
    text: string;
    createdAt: number; // Make it required instead of optional
  }
>;

// Create the markdown shape util class
export class MarkdownShapeUtil extends BaseBoxShapeUtil<MarkdownShape> {
  static override type = 'markdown' as const;

  static override props: RecordProps<MarkdownShape> = {
    w: T.number,
    h: T.number,
    text: T.string,
    createdAt: T.number, // Changed from optional to required
  };

  // Enable editing
  override canEdit(): boolean {
    return true;
  }

  // Default props when created
  override getDefaultProps() {
    return {
      w: 400,
      h: 300,
      text: `# Markdown Note

This is a **markdown** note with code highlighting support!

## Features

- Syntax highlighting
- Supports all markdown features
- More features coming soon

## Code Example

\`\`\`javascript
function hello() {
  console.log("Hello world!");

  const items = [1, 2, 3, 4, 5];

  items.forEach(item => {
    console.log(\`Processing item \${item}\`);
  });

  return {
    success: true,
    message: "Operation completed successfully"
  };
}
\`\`\``,
      createdAt: Date.now() // Set creation timestamp to current time
    };
  }

  // Helper method for code block syntax highlighting
  private getCodeBlockRenderer() {
    return (code: string, language: string | undefined) => {
      if (!language) language = 'text';
      return (
        <SyntaxHighlighter
          language={language}
          style={tomorrow}
          customStyle={{
            borderRadius: '4px',
            margin: '1em 0',
          }}
        >
          {code}
        </SyntaxHighlighter>
      );
    };
  }

  // Render the component
  override component(shape: MarkdownShape) {
    const [value, setValue] = useState(shape.props.text);
    const isEditing = this.editor.getEditingShapeId() === shape.id;
    const isSelected = this.editor.getSelectedShapeIds().includes(shape.id);

    // Format the creation date
    const formattedDate = formatDate(shape.props.createdAt);

    // Handle text changes
    const handleTextChange = useCallback((value: string) => {
      setValue(value);
      this.editor.updateShape<MarkdownShape>({
        id: shape.id,
        type: 'markdown',
        props: {
          ...shape.props, // Preserve other props including createdAt
          text: value
        }
      });
    }, [shape.id, shape.props]);

    // Update value when shape text changes
    useEffect(() => {
      setValue(shape.props.text);
    }, [shape.props.text]);

    // CodeMirror extensions
    const extensions = [
      markdown(),
      EditorView.lineWrapping,
    ];

    return (
      <HTMLContainer
        id={shape.id}
        className={isEditing ? 'tldraw-editing-container' : undefined}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          backgroundColor: 'white',
          pointerEvents: 'all',
        }}
        onPointerDown={isEditing ? stopEventPropagation : undefined}
        onWheel={stopEventPropagation}
      >
        {/* Toolbar with creation date */}
        <div
          style={{
            padding: '8px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            background: '#f8f8f8',
            height: '32px',
            boxSizing: 'border-box',
            flexShrink: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: '12px', color: '#666', marginRight: 'auto' }}>
            {isEditing ? 'Edit Mode' : `Created: ${formattedDate}`}
          </div>
        </div>

        {/* Content Area */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {isEditing ? (
            <div
              style={{
                height: '100%',
                overflow: 'hidden',
              }}
              onPointerDown={stopEventPropagation}
              onClick={(e) => e.stopPropagation()}
            >
              <CodeMirror
                value={value}
                height="100%"
                extensions={extensions}
                onChange={handleTextChange}
                style={{
                  height: '100%',
                  fontSize: '14px',
                }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          ) : (
            <div
              className="markdown-code-view"
              style={{
                height: '100%',
                width: '100%',
                overflow: 'auto',
                padding: '16px',
                fontSize: '14px',
                lineHeight: '1.5',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                color: '#333',
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                this.editor.select(shape.id);
                this.editor.setEditingShape(shape.id);
              }}
            >
              {(() => {
                const text = shape.props.text;
                const codeBlocks = extractCodeBlocks(text);

                // Create a copy of the text to modify
                let processedText = text;

                // Replace each code block with a placeholder
                codeBlocks.forEach((block, index) => {
                  const codeBlockString = `\`\`\`${block.language}\n${block.code}\n\`\`\``;
                  processedText = processedText.replace(
                    codeBlockString,
                    `__CODE_BLOCK_${index}__`
                  );
                });

                // Split the text by our placeholders
                const parts = processedText.split(/(__CODE_BLOCK_\d+__)/);

                // Map the parts, replacing placeholders with rendered code blocks
                return parts.map((part, index) => {
                  const match = part.match(/__CODE_BLOCK_(\d+)__/);
                  if (match) {
                    const blockIndex = parseInt(match[1]);
                    const block = codeBlocks[blockIndex];
                    return (
                      <SyntaxHighlighter
                        key={index}
                        language={block.language}
                        style={tomorrow}
                        customStyle={{
                          borderRadius: '4px',
                          margin: '1em 0',
                        }}
                      >
                        {block.code}
                      </SyntaxHighlighter>
                    );
                  } else {
                    // For non-code parts, we render them as pre-formatted text with basic markdown styling
                    return (
                      <div key={index} style={{ whiteSpace: 'pre-wrap', marginBottom: '8px' }}>
                        {part.split('\n').map((line, lineIndex) => {
                          // Very basic markdown styling for headers
                          if (line.startsWith('# ')) {
                            return <h1 key={lineIndex} style={{ margin: '0.5em 0' }}>{line.substring(2)}</h1>;
                          } else if (line.startsWith('## ')) {
                            return <h2 key={lineIndex} style={{ margin: '0.5em 0' }}>{line.substring(3)}</h2>;
                          } else if (line.startsWith('### ')) {
                            return <h3 key={lineIndex} style={{ margin: '0.5em 0' }}>{line.substring(4)}</h3>;
                          } else if (line.startsWith('- ')) {
                            return <div key={lineIndex} style={{ marginLeft: '10px' }}>• {line.substring(2)}</div>;
                          } else {
                            // Basic styling for bold and italic (very simplified)
                            let styledLine = line;
                            styledLine = styledLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                            styledLine = styledLine.replace(/\*(.*?)\*/g, '<em>$1</em>');

                            return (
                              <div
                                key={lineIndex}
                                style={{ marginBottom: '3px' }}
                                dangerouslySetInnerHTML={{ __html: styledLine }}
                              />
                            );
                          }
                        })}
                      </div>
                    );
                  }
                });
              })()}
            </div>
          )}
        </div>

        {/* Help text shown when not editing */}
        {!isEditing && (
          <div style={{
            position: 'absolute',
            bottom: '5px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '12px',
            opacity: 0.5,
            pointerEvents: 'none'
          }}>
            Double-click to edit
          </div>
        )}
      </HTMLContainer>
    );
  }

  // Indicator for selection
  override indicator(shape: MarkdownShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={8}
        ry={8}
      />
    );
  }
}