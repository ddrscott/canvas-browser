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
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';


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

const marked = new Marked(
  markedHighlight({
	emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  })
);

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
        className={`w-full h-full flex flex-col rounded-lg overflow-hidden shadow-md bg-white ${isEditing ? 'tldraw-editing-container' : ''}`}
        onPointerDown={isEditing ? stopEventPropagation : undefined}
        onWheel={isEditing ? stopEventPropagation : undefined}
      >
        {/* Toolbar with creation date */}
        <div
          className="p-2 border-b border-gray-200 flex justify-end items-center bg-gray-50 h-8 box-border flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-xs text-gray-500 mr-auto">
            {isEditing ? 'Edit Mode' : `Created: ${formattedDate}`}
          </div>
        </div>

        {/* Content Area */}
        <div
          className="flex-1 overflow-hidden relative"
        >
          {isEditing ? (
            <div
              className="h-full overflow-hidden"
              onPointerDown={stopEventPropagation}
              onClick={(e) => e.stopPropagation()}
            >
              <CodeMirror
                value={value}
                height="100%"
                extensions={extensions}
                onChange={handleTextChange}
                className="h-full text-sm"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          ) : (
            <div
              className="markdown-code-view h-full w-full overflow-auto p-4 text-sm leading-normal font-sans text-gray-800"
              onDoubleClick={(e) => {
                e.stopPropagation();
                this.editor.select(shape.id);
                this.editor.setEditingShape(shape.id);
              }}
            >
                <div
                    className="mb-0.5"
                    dangerouslySetInnerHTML={{ __html: marked.parse(shape.props.text) }}
                />
            </div>
          )}
        </div>

        {/* Help text shown when not editing */}
        {!isEditing && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-xs opacity-50 pointer-events-none">
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
