import React from 'react';
import {
    BaseBoxShapeUtil,
    HTMLContainer,
    RecordProps,
    T,
    TLBaseShape,
    stopEventPropagation
} from '@tldraw/tldraw';

import { marked } from './MarkdownShape';

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

        const summaryHtml = data.summary ? marked.parse(data.summary) : '';

        return (
            <HTMLContainer
                id={shape.id}
                className={`w-full h-full text-sm leading-normal flex flex-col rounded-lg overflow-hidden shadow-md bg-white ${isEditing ? 'pointer-events-auto' : 'pointer-events-none'}`}
                onPointerDown={isEditing ? stopEventPropagation : undefined}
                onWheel={isEditing ? stopEventPropagation : undefined}
            >
                {/* Toolbar with creation date */}
                <div
                    className="p-2 border-b border-gray-200 flex justify-end items-center bg-gray-50 box-border flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="text-xs text-gray-500 font-bold mr-auto">
                        { data.title || 'Untitled' }
                    </div>
                    { data.favicon && <img src={data.favicon} className="w-4 h-4 mr-2" /> }
                </div>

                {/* Content Area */}
                { data.image && <img src={data.image} className="w-full h-auto max-h-[15em] object-cover shadow-sm" /> }
                <div
                    className="flex-1 overflow-auto p-4"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={stopEventPropagation}
                >
                    <h2 className="m-0">{data.title || 'Untitled'}</h2>
                    {data.author && <small className="text-gray-500 text-xs">by {data.author}</small>}
                    {data.url && <small className="text-gray-500 text-xs">{data.url}</small>}

                    <p
                        className="prose prose-sm !max-w-none"
                        dangerouslySetInnerHTML={{ __html: summaryHtml }}
                    />
                    <hr className="my-2" />
                    <article
                        className="prose prose-sm !max-w-none"
                        dangerouslySetInnerHTML={{ __html: data.text }} />
                    <details>
                        <summary>Raw Data</summary>
                        <pre
                            className="m-0 whitespace-pre-wrap break-words text-xs leading-normal font-mono"
                        >
                            <code>
                            {JSON.stringify(data, null, 2)}
                            </code>
                        </pre>
                    </details>
                </div>
                <div
                    className="p-2 border-b border-gray-200 flex justify-end items-center bg-gray-50 box-border flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="text-xs text-gray-500 ml-auto">
                        Created: { formattedDate }
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
