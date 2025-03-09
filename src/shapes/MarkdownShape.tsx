import React from 'react';
import { 
  BaseBoxShapeUtil, 
  HTMLContainer,
  RecordProps,
  T,
  TLBaseShape,
  stopEventPropagation
} from '@tldraw/tldraw';
import ReactMarkdown from 'react-markdown';

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
      text: '# Hello World\n\nThis is a markdown note. Edit me!'
    };
  }

  // Render the component
  override component(shape: MarkdownShape) {
    // Check if this shape is currently being edited
    const isEditing = this.editor.getEditingShapeId() === shape.id;
    
    // Local state for the text value
    const [text, setText] = React.useState(shape.props.text);
    
    // Toggle between preview and edit mode
    const [isPreview, setIsPreview] = React.useState(false);
    
    // Text area ref for focus management
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    
    // Handle text changes
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      setText(newText);
      
      // Update the shape with new text
      this.editor.updateShape({
        id: shape.id,
        type: 'markdown',
        props: {
          ...shape.props,
          text: newText
        }
      });
    };
    
    // Toggle between edit and preview mode
    const togglePreview = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsPreview(!isPreview);
      
      // If switching to edit mode while already being edited by TLDraw,
      // make sure the textarea gets focus
      if (isEditing && isPreview) {
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 0);
      }
    };
    
    // Update local state when props change
    React.useEffect(() => {
      setText(shape.props.text);
    }, [shape.props.text]);
    
    // Focus the textarea when editing begins
    React.useEffect(() => {
      if (isEditing && !isPreview && textareaRef.current) {
        textareaRef.current.focus();
      }
    }, [isEditing, isPreview]);
    
    return (
      <HTMLContainer
        id={shape.id}
        // Critical: Stop event propagation when editing to prevent canvas interactions
        onPointerDown={isEditing ? stopEventPropagation : undefined}
        style={{
          width: '100%',
          height: '100%',
          padding: 0,
          margin: 0,
          pointerEvents: isEditing ? 'all' : 'none',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Toolbar with toggle button */}
        <div 
          style={{ 
            padding: '8px', 
            borderBottom: '1px solid #eee', 
            display: 'flex', 
            justifyContent: 'flex-end',
            background: '#f8f8f8'
          }}
        >
          {isEditing && (
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
          )}
        </div>
        
        {/* Content area - either markdown preview or editor */}
        <div 
          style={{ 
            flex: 1, 
            overflow: 'auto', 
            padding: '16px'
          }}
        >
          {isEditing ? (
            // When in editing mode with TLDraw
            isPreview ? (
              // Markdown preview
              <div className="markdown-content">
                <ReactMarkdown>{text}</ReactMarkdown>
              </div>
            ) : (
              // Markdown editor
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                style={{
                  width: '100%',
                  height: '100%',
                  resize: 'none',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  padding: '0',
                  background: 'transparent'
                }}
              />
            )
          ) : (
            // When not in editing mode, always show the preview
            <div className="markdown-content">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          )}
        </div>
        
        {!isEditing && (
          <div style={{ 
            position: 'absolute', 
            bottom: '5px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            fontSize: '12px',
            opacity: 0.5
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
