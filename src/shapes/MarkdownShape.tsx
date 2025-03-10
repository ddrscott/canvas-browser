import React, { useCallback, useRef, useEffect } from 'react';
import { 
  BaseBoxShapeUtil, 
  HTMLContainer,
  RecordProps,
  T,
  TLBaseShape,
  stopEventPropagation
} from '@tldraw/tldraw';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';

// Define the markdown shape type
type MarkdownShape = TLBaseShape<
  'markdown',
  { 
    w: number;
    h: number;
    text: string;
    isPreview: boolean;
  }
>;

// Create the markdown shape util class
export class MarkdownShapeUtil extends BaseBoxShapeUtil<MarkdownShape> {
  static override type = 'markdown' as const;
  
  static override props: RecordProps<MarkdownShape> = {
    w: T.number,
    h: T.number,
    text: T.string,
    isPreview: T.boolean,
  };

  // Enable editing - this is key for the shape to be editable!
  override canEdit(): boolean {
    return true;
  }

  // Default props when created
  override getDefaultProps() {
    return {
      w: 400,
      h: 300,
      isPreview: false,
      text: `# Markdown Note

This is a **markdown** note with code highlighting and scrolling support!

## Features

- Syntax highlighting
- Supports all markdown features
- Toggle between edit and preview modes
- Proper scrolling for long content

## Code Example

\`\`\`javascript
function hello() {
  console.log("Hello world!");
  
  // This is a longer code example to demonstrate scrolling
  const items = [1, 2, 3, 4, 5];
  
  items.forEach(item => {
    console.log(\`Processing item \${item}\`);
  });
  
  return {
    success: true,
    message: "Operation completed successfully"
  };
}

// Another function example
function processData(data) {
  if (!data) {
    throw new Error("Data is required");
  }
  
  return data.map(item => ({
    ...item,
    processed: true,
    timestamp: new Date().toISOString()
  }));
}
\`\`\`

## More Content for Scrolling

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam eget felis euismod, 
rhoncus metus id, gravida est. Cras auctor efficitur libero, eu bibendum eros facilisis ac.

> This is a blockquote that contains important information about the scrolling behavior
> Multiple lines will help demonstrate how it handles overflow content

### Tables

| Feature | Supported | Notes |
| ------- | --------- | ----- |
| Headings | Yes | H1, H2, H3, etc. |
| Lists | Yes | Ordered and unordered |
| Code blocks | Yes | With syntax highlighting |
| Tables | Yes | As shown here |
| Images | Yes | Not demonstrated |
| Links | Yes | [Visit TLDraw](https://tldraw.com) |

---

The scrolling should work smoothly in both edit and preview modes!`
    };
  }

  // Custom renderer for code blocks in markdown
  private getComponents() {
    return {
      code({node, inline, className, children, ...props}: any) {
        const match = /language-(\w+)/.exec(className || '');
        return !inline && match ? (
          <SyntaxHighlighter
            style={tomorrow}
            language={match[1]}
            PreTag="div"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        ) : (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }
    };
  }

  // Render the component
  override component(shape: MarkdownShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id;
    const isSelected = this.editor.getSelectedShapeIds().includes(shape.id);
    const components = this.getComponents();
    
    // Toggle preview on/off
    const togglePreview = () => {
      this.editor.updateShape<MarkdownShape>({
        id: shape.id,
        type: 'markdown',
        props: {
          isPreview: !shape.props.isPreview
        }
      });
    };
    
    // Handle text changes
    const handleTextChange = (value: string) => {
      this.editor.updateShape<MarkdownShape>({
        id: shape.id,
        type: 'markdown',
        props: {
          text: value
        }
      });
    };
    
    // Create a ref for the iframe
    const iframeRef = useRef<HTMLIFrameElement>(null);

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
          // Critical: We need pointer events for wheel events (scrolling) to work
          pointerEvents: 'all',
        }}
        // Only pass stopEventPropagation when editing to make sure edit events don't bubble
        onPointerDown={isEditing ? stopEventPropagation : undefined}
        onWheel={stopEventPropagation}
      >
        {/* Toolbar */}
        <div 
          style={{ 
            padding: '8px', 
            borderBottom: '1px solid #eee', 
            display: 'flex', 
            justifyContent: 'flex-end',
            alignItems: 'center',
            background: '#f8f8f8',
            gap: '8px',
            height: '32px',
            boxSizing: 'border-box',
            flexShrink: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: '12px', color: '#666', marginRight: 'auto' }}>
            {isEditing ? (shape.props.isPreview ? 'Preview Mode' : 'Edit Mode') : 'Markdown Note'}
          </div>
          
          {isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePreview();
              }}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                background: shape.props.isPreview ? '#e0e0e0' : '#f0f0f0',
                border: '1px solid #ddd',
                fontSize: '12px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              {shape.props.isPreview ? 'Edit' : 'Preview'}
            </button>
          )}
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
            shape.props.isPreview ? (
              // Preview Mode when editing
              <div 
                className="markdown-content"
                style={{
                  height: '100%',
                  width: '100%',
                  overflow: 'auto',
                  padding: '16px'
                }}
                onWheel={stopEventPropagation}
              >
                <ReactMarkdown
                  components={components}
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                >
                  {shape.props.text}
                </ReactMarkdown>
              </div>
            ) : (
              // Edit Mode
              <div
                style={{
                  height: '100%',
                  width: '100%',
                  position: 'relative',
                  overflow: 'hidden' // Ensure the container doesn't overflow
                }}
                className="tldraw-codemirror"
              >
                {/* Using an iframe to isolate the scrolling completely */}
                <iframe
                  ref={iframeRef}
                  src="about:blank"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block',
                    backgroundColor: '#1e1e1e'
                  }}
                  title="Markdown Editor"
                  onLoad={() => {
                    if (iframeRef.current) {
                      const doc = iframeRef.current.contentDocument;
                      if (doc) {
                        // Create a basic editor inside the iframe
                        doc.body.innerHTML = `
                          <style>
                            body, html {
                              margin: 0;
                              padding: 0;
                              height: 100%;
                              width: 100%;
                              overflow: auto;
                              background-color: #1e1e1e;
                              color: #d4d4d4;
                              font-family: monospace;
                            }
                            textarea {
                              width: 100%;
                              height: 100%;
                              box-sizing: border-box;
                              border: none;
                              padding: 10px;
                              background-color: transparent;
                              color: inherit;
                              font-size: 14px;
                              line-height: 1.5;
                              resize: none;
                              outline: none;
                            }
                          </style>
                          <textarea id="editor" spellcheck="false"></textarea>
                        `;
                        
                        // Set the initial content
                        const textarea = doc.getElementById('editor') as HTMLTextAreaElement;
                        if (textarea) {
                          textarea.value = shape.props.text;
                          
                          // Handle changes
                          textarea.addEventListener('input', () => {
                            handleTextChange(textarea.value);
                          });
                        }
                      }
                    }
                  }}
                />
              </div>
            )
          ) : (
            // View Mode (not editing)
            <div 
              className="markdown-content"
              style={{
                height: '100%',
                width: '100%',
                overflow: 'auto',
                padding: '16px'
              }}
            >
              <ReactMarkdown
                components={components}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
              >
                {shape.props.text}
              </ReactMarkdown>
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
  
  // Add animation when exiting edit mode
  override onEditEnd(shape: MarkdownShape) {
    // Reset to non-preview mode for next edit
    if (shape.props.isPreview) {
      this.editor.updateShape<MarkdownShape>({
        id: shape.id,
        type: 'markdown',
        props: {
          isPreview: false
        }
      });
    }
  }
  
  // Override isEditing to always return true when a shape is selected
  // This ensures it stays editable
  override isEditing(shape: MarkdownShape, id: string): boolean {
    return this.editor.getEditingShapeId() === id;
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
