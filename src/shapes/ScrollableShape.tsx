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
        className="scrollable-shape overflow-hidden shadow-md bg-orange-400 pointer-events-auto relative rounded-lg"
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-2 bg-orange-500 text-white font-medium text-center border-b border-orange-600">
          Simple Scrollable Shape
        </div>

        {/* Content */}
        {isEditing ? (
          <textarea
            className="w-full h-[calc(100%-64px)] p-4 resize-none outline-none pointer-events-auto bg-white"
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
            className="w-full h-[calc(100%-64px)] p-4 overflow-auto bg-white"
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
          <div className="absolute bottom-0 w-full py-1 text-center text-xs text-white bg-orange-500 opacity-80">
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
