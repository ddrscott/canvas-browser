import React from 'react';
import { 
  BaseBoxShapeUtil, 
  HTMLContainer,
  RecordProps,
  T,
  TLBaseShape,
} from '@tldraw/tldraw';

// Define the scrollable shape type
type ScrollableShape = TLBaseShape<
  'scrollable',
  { 
    w: number;
    h: number;
    text: string;
  }
>;

// Create the scrollable shape util class
export class ScrollableShapeUtil extends BaseBoxShapeUtil<ScrollableShape> {
  static override type = 'scrollable' as const;
  
  static override props: RecordProps<ScrollableShape> = {
    w: T.number,
    h: T.number,
    text: T.string,
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
      text: `This is a simple scrollable text area.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam eget felis euismod, 
rhoncus metus id, gravida est. Cras auctor efficitur libero, eu bibendum eros facilisis ac.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam eget felis euismod, 
rhoncus metus id, gravida est. Cras auctor efficitur libero, eu bibendum eros facilisis ac.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam eget felis euismod, 
rhoncus metus id, gravida est. Cras auctor efficitur libero, eu bibendum eros facilisis ac.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam eget felis euismod, 
rhoncus metus id, gravida est. Cras auctor efficitur libero, eu bibendum eros facilisis ac.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam eget felis euismod, 
rhoncus metus id, gravida est. Cras auctor efficitur libero, eu bibendum eros facilisis ac.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam eget felis euismod, 
rhoncus metus id, gravida est. Cras auctor efficitur libero, eu bibendum eros facilisis ac.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam eget felis euismod, 
rhoncus metus id, gravida est. Cras auctor efficitur libero, eu bibendum eros facilisis ac.`
    };
  }

  // Render the component - ultra simplified version
  override component(shape: ScrollableShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id;
    
    // Define a function to update text that ensures we have the current shape id
    const updateText = (text: string) => {
      this.editor.updateShape<ScrollableShape>({
        id: shape.id,
        type: 'scrollable',
        props: { text }
      });
    };

    return (
      <HTMLContainer
        id={shape.id}
        className="scrollable-shape"
        onWheel={(e) => e.stopPropagation()}
        style={{
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          background: 'orange',
          // Main container must remain clickable for selection
          pointerEvents: 'all', 
          position: 'relative'
        }}
      >
        {/* Header */}
        <div className="scrollable-header">
          Simple Scrollable Shape
        </div>

        {/* Content */}
        {isEditing ? (
          <textarea
            className="scrollable-textarea"
            style={{
              pointerEvents: 'all', 
            }}
            value={shape.props.text}
            onChange={(e) => updateText(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <div
            className="scrollable-content"
            onDoubleClick={(e) => {
              e.stopPropagation();
              this.editor.select(shape.id);
              this.editor.setEditingShape(shape.id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            {shape.props.text}
          </div>
        )}

        {/* Footer help text */}
        {!isEditing && (
          <div className="scrollable-footer">
            Double-click to edit
          </div>
        )}
      </HTMLContainer>
    );
  }
  
  // Indicator for selection
  override indicator(shape: ScrollableShape) {
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
