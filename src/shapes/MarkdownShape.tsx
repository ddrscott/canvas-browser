import React from 'react';
import { 
  BaseBoxShapeUtil, 
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

// Define the markdown shape type
type MarkdownShape = TLBaseShape<
  'markdown',
  { 
    w: number;
    h: number;
    text: string;
  }
>;

// Create the markdown shape util class
export class MarkdownShapeUtil extends BaseBoxShapeUtil<MarkdownShape> {
  static override type = 'markdown' as const;
  
  static override props: RecordProps<MarkdownShape> = {
    w: T.number,
    h: T.number,
    text: T.string,
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

  // Add support for scrolling
  override canScroll(): boolean {
    return true;
  }

  // Render the component
  override component(shape: MarkdownShape) {
    // Check if this shape is currently being edited
    const isEditing = this.editor.getEditingShapeId() === shape.id;
    const isSelected = this.editor.getSelectedShapeIds().includes(shape.id);
    
    // Local state for the text value
    const [text, setText] = React.useState(shape.props.text);
    
    // Toggle between preview and edit mode
    const [isPreview, setIsPreview] = React.useState(false);
    
    // Handle text changes from CodeMirror
    const handleTextChange = (value: string) => {
      setText(value);
      
      // Update the shape with new text
      this.editor.updateShape({
        id: shape.id,
        type: 'markdown',
        props: {
          ...shape.props,
          text: value
        }
      });
    };
    
    // Toggle between edit and preview mode
    const togglePreview = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsPreview(!isPreview);
    };
    
    // Update local state when props change
    React.useEffect(() => {
      setText(shape.props.text);
    }, [shape.props.text]);
    
    // Custom renderer for code blocks in markdown
    const components = {
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
    
    return (
      <div
        style={{
          width: shape.props.w,
          height: shape.props.h,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: isSelected ? '0 0 0 2px #4285f4, 0 2px 10px rgba(0,0,0,0.1)' : '0 2px 10px rgba(0,0,0,0.1)',
          background: 'white',
          pointerEvents: 'all', 
          position: 'relative',
          transition: 'box-shadow 0.2s ease',
        }}
        onClick={(e) => {
          if (!isSelected) {
            this.editor.select(shape.id);
          }
        }}
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
            boxSizing: 'border-box'
          }}
        >
          {isEditing ? (
            <>
              <div style={{ fontSize: '12px', color: '#666', marginRight: 'auto' }}>
                {isPreview ? 'Preview Mode' : 'Edit Mode'}
              </div>
              <button
                onClick={togglePreview}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: isPreview ? '#e0e0e0' : '#f0f0f0',
                  border: '1px solid #ddd',
                  fontSize: '12px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                {isPreview ? 'Edit' : 'Preview'}
              </button>
            </>
          ) : (
            <div style={{ fontSize: '12px', color: '#666', marginRight: 'auto' }}>
              Markdown Note
            </div>
          )}
        </div>
        
        {/* Content Area */}
        <div style={{ position: 'relative', flex: 1 }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              overflow: 'auto',
              padding: (isEditing && !isPreview) ? 0 : '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {isEditing && !isPreview ? (
              // Edit Mode
              <CodeMirror
                value={text}
                height="100%"
                onChange={handleTextChange}
                extensions={[markdown()]}
                theme="dark"
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLine: true,
                  highlightActiveLineGutter: true,
                  foldGutter: true
                }}
                style={{
                  height: '100%'
                }}
              />
            ) : (
              // Preview Mode (both when editing and not)
              <div className="markdown-content">
                <ReactMarkdown
                  components={components}
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                >
                  {text}
                </ReactMarkdown>
              </div>
            )}
          </div>
          
          {/* Invisible layer to block interactions when not selected/editing */}
          {!isSelected && !isEditing && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10,
              }}
              onClick={(e) => {
                e.stopPropagation();
                this.editor.select(shape.id);
              }}
            />
          )}
        </div>
        
        {/* Help text */}
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
      </div>
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
