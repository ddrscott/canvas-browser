import React from 'react';
import {
    BaseBoxShapeUtil,
    HTMLContainer,
    RecordProps,
    T,
    TLBaseShape,
    stopEventPropagation
} from '@tldraw/tldraw';

// Define the ExaSearchResult shape type
type ExaSearchResultShape = TLBaseShape<
'exaSearchResult',
{
    w: number;
    h: number;
    resultData: object;
    createdAt: number;
}
>;

// Create the ExaSearchResult shape util class
export class ExaSearchResultShapeUtil extends BaseBoxShapeUtil<ExaSearchResultShape> {
    static override type = 'exaSearchResult' as const;

    static override props: RecordProps<ExaSearchResultShape> = {
        w: T.number,
        h: T.number,
        resultData: T.any,
        createdAt: T.number,
    };

    override canEdit(): boolean {
        return true;
    }

    override canResize(): boolean {
        return true; // Allow resizing
    }
    // Enable scrolling
    override canScroll(): boolean {
        return true;
    }


    // Default props when created
    override getDefaultProps() {
        return {
            w: 400,
            h: 500,
            resultData: {},
            createdAt: Date.now() // Set creation timestamp to current time
        };
    }

    // Indicator for selection
    override indicator(shape: ExaSearchResultShape) {
        return (
            <rect
                width={shape.props.w}
                height={shape.props.h}
            />
        );
    }

    // Render the component
    override component(shape: ExaSearchResultShape) {
        // Format the creation date
        const formattedDate = formatDate(shape.props.createdAt);
        const isEditing = this.editor.getEditingShapeId() === shape.id


        const data = shape.props.resultData as any;

        return (
            <HTMLContainer
                id={shape.id}
                style={{
                    width: '100%',
                    height: '100%',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    backgroundColor: 'white',
                    pointerEvents: isEditing ? 'all' : 'none',
                }}
                onPointerDown={isEditing ? stopEventPropagation : undefined}
                onWheel={isEditing ? stopEventPropagation : undefined}
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
                        { data.title || 'Untitled' }
                    </div>
                    { data.favicon && <img src={data.favicon} style={{ width: '16px', height: '16px', marginRight: '8px' }} /> }
                </div>

                {/* Content Area */}
                { data.image && <img src={data.image} style={{ width: '100%', height: 'auto', maxHeight: '15em', objectFit: 'cover', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} /> }
                <div
                    style={{
                        flex: 1,
                        overflow: 'auto',
                        padding: '16px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={stopEventPropagation}
                >
                    <h2 style={{ margin: 0 }}>{data.title || 'Untitled'}</h2>
                    {data.author && <small style={{ color: '#666', fontSize: '12px' }}>by {data.author}</small>}
                    {data.url && <small style={{ color: '#666', fontSize: '12px' }}>{data.url}</small>}

                    <summary dangerouslySetInnerHTML={{ __html: data.summary }} />
                    <p dangerouslySetInnerHTML={{ __html: data.text }} />

                    <details>
                        <summary>Raw Data</summary>
                        <pre
                            style={{
                                margin: 0,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                fontSize: '12px',
                                lineHeight: '1.5',
                                fontFamily: 'monospace',
                            }}
                        >
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </details>
                </div>
                <div
                    style={{
                        padding: '8px',
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        background: '#f8f8f8',
                        boxSizing: 'border-box',
                        flexShrink: 0,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ fontSize: '12px', color: '#666', marginRight: 'auto' }}>
                        created: { formattedDate }
                    </div>
                </div>

            </HTMLContainer>
        );
    }

}

// Utility function to format a date
function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
