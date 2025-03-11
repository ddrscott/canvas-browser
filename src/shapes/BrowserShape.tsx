/* eslint-disable react-hooks/rules-of-hooks */
import React from 'react';
import { 
  BaseBoxShapeUtil,
  HTMLContainer,
  TLBaseShape, 
  useDelaySvgExport,
  stopEventPropagation
} from '@tldraw/tldraw';

// Define the browser shape type
type BrowserShape = TLBaseShape<
  'browser',
  { 
    w: number;
    h: number;
    url: string;
    scrollX: number;
    scrollY: number;
    innerHTML?: string;
  }
>;

// Create the browser shape util class
export class BrowserShapeUtil extends BaseBoxShapeUtil<BrowserShape> {
  static override type = 'browser' as const;

  // Enable scrolling
  override canScroll(): boolean {
    return true;
  }

  // Enable editing
  override canEdit(): boolean {
    return true;
  }

  // Preserve scroll position when edit mode ends
  override onEditEnd(shape: BrowserShape): void {
    const webview = document.querySelector(`[data-shape-id="${shape.id}"] webview`) as any;
    if (!webview) return;
  }

  // Default props when created
  override getDefaultProps() {
    return {
      w: 400,
      h: 800,
      url: 'https://www.google.com',
      scrollX: 0,
      scrollY: 0,
      innerHTML: ''
    };
  }

  // Render the component
  override component(shape: BrowserShape) {
    const isReady = useDelaySvgExport();
    const isEditing = this.editor.getEditingShapeId() === shape.id;
    
    // Use a ref for the webview element
    const webviewRef = React.useRef<HTMLDivElement>(null);
    const [url, setUrl] = React.useState(shape.props.url);
    
    // Handle URL input changes
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setUrl(e.target.value);
      e.stopPropagation();
    };
    
    // Handle URL form submission
    const handleUrlSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Make sure URL has a protocol
      let urlToLoad = url;
      if (!/^https?:\/\//i.test(urlToLoad)) {
        urlToLoad = 'https://' + urlToLoad;
        setUrl(urlToLoad); // Update display with protocol
      }
      
      // Update the shape with the new URL
      this.editor.updateShape({
        id: shape.id,
        type: 'browser',
        props: {
          ...shape.props,
          url: urlToLoad,
          // Reset scroll position for new navigation
          scrollX: 0,
          scrollY: 0,
          // Explicitly preserve dimensions
          w: shape.props.w,
          h: shape.props.h
        }
      });
      
      // Navigate the webview
      if (webviewRef.current) {
        const webview = webviewRef.current.querySelector('webview');
        if (webview) {
          (webview as any).loadURL(urlToLoad);
        }
      }
    };
    
    // Handle back button click
    const handleBackClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (webviewRef.current) {
        const webview = webviewRef.current.querySelector('webview');
        if (webview && (webview as any).canGoBack && (webview as any).canGoBack()) {
          (webview as any).goBack();
        }
      }
    };
    
    // Handle forward button click
    const handleForwardClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (webviewRef.current) {
        const webview = webviewRef.current.querySelector('webview');
        if (webview && (webview as any).canGoForward && (webview as any).canGoForward()) {
          (webview as any).goForward();
        }
      }
    };
    
    // Handle refresh button click
    const handleRefreshClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (webviewRef.current) {
        const webview = webviewRef.current.querySelector('webview');
        if (webview && (webview as any).reload) {
          (webview as any).reload();
        }
      }
    };
    
    // Setup the webview on mount - only run once
    React.useEffect(() => {
      // Store a flag in the DOM element to check if we've already set up this webview
      if (!webviewRef.current || (webviewRef.current as any).__webviewInitialized) return;
      
      // Mark as initialized to prevent re-runs
      (webviewRef.current as any).__webviewInitialized = true;
      
      const scrollHandler: NodeJS.Timeout | null = null;
      
      if (isReady) {
        // Create a webview element
        const webview = document.createElement('webview');
        
        // Configure webview like a regular browser tab
        webview.src = shape.props.url;
        webview.setAttribute('partition', 'persist:tldraw');
        webview.setAttribute('allowpopups', 'true');
        webview.setAttribute('webpreferences', 'javascript=yes');
        
        // Style the webview
        webview.style.width = '100%';
        webview.style.height = '100%';
        webview.style.border = 'none';
        
        // Add logging and event handlers
        webview.addEventListener('did-start-loading', () => {
          // console.log('Webview started loading:', shape.props.url);
        });
        
        webview.addEventListener('console-message', (e) => {
          // console.log('Guest page logged a message:', e.message)
        })

        webview.addEventListener('did-finish-load', () => {
          // console.log('Webview finished loading:', shape.props.url);
          // Update URL in input
          const currentUrl = (webview as any).getURL();
          if (currentUrl) {
            setUrl(currentUrl);
          }
        });
        
        webview.addEventListener('did-fail-load', (event) => {
          console.error('Webview failed to load:', event);
        });
        
        webview.addEventListener('did-navigate', (event: any) => {
          if (event.url) {
            setUrl(event.url);

            // update shape's url
            this.editor.updateShape({ id: shape.id, type: 'browser', props: { url: event.url } });
          }
        });
        
        // Also handle in-page navigation (hash changes, etc.)
        webview.addEventListener('did-navigate-in-page', (event: any) => {
          if (event.url) {
            setUrl(event.url);
            // update shape's url
            this.editor.updateShape({ id: shape.id, type: 'browser', props: { url: event.url } });
          }
        });
        
        // Add to DOM
        webviewRef.current.appendChild(webview);
      }
      
      // Clean up interval on unmount
      return () => {
        if (scrollHandler) {
          clearInterval(scrollHandler);
        }
      };
    // Only depend on isReady and shape.id, but NOT on isEditing
    }, [isReady, shape.id]);
    
    // Always update URL state when props change
    React.useEffect(() => {
      setUrl(shape.props.url);
    }, [shape.props.url]);
    
    return (
      <HTMLContainer
        id={shape.id}
        className={`w-full h-full flex flex-col rounded-lg overflow-hidden shadow-md bg-white pointer-events-auto ${isEditing ? 'tldraw-editing-container' : ''}`}
        onPointerDown={isEditing ? stopEventPropagation : undefined}
        onWheel={isEditing ? stopEventPropagation : undefined}
      >
        {/* Browser toolbar */}
        <div
          className="h-8 bg-gray-100 border-b border-gray-300 flex items-center px-2.5 w-full relative"
          style={{ pointerEvents: isEditing ? 'auto' : 'none' }}
        >
          {/* Back button */}
          <button
            type="button"
            onClick={handleBackClick}
            className="w-4 h-4 rounded-full bg-gray-300 mr-1.5 cursor-pointer flex items-center justify-center text-xs"
          >
            ←
          </button>
          {/* Forward button */}
          <button
            type="button"
            onClick={handleForwardClick}
            className="w-4 h-4 rounded-full bg-gray-300 mr-2.5 cursor-pointer flex items-center justify-center text-xs"
          >
            →
          </button>
          
          {/* URL bar */}
          <form 
            className="flex-1"
            onSubmit={handleUrlSubmit}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={url}
              onChange={handleUrlChange}
              onKeyDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="w-full h-[22px] bg-white rounded-[11px] px-2.5 text-xs border border-gray-300 outline-none text-gray-600 box-border"
            />
          </form>
          
          {/* Refresh button */}
          <button
            type="button"
            onClick={handleRefreshClick}
            className="w-4 h-4 rounded-full bg-gray-300 ml-2.5 cursor-pointer flex items-center justify-center text-xs"
          >
            ↻
          </button>
        </div>
        
        <div 
          className="flex-1 relative"
        >
          {/* Webview container - always visible */}
          <div
            ref={webviewRef}
            data-shape-id={shape.id}
            className="w-full h-full absolute inset-0 pointer-events-auto"
          />
          
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 text-xs text-gray-600 bg-white/80 px-2 py-0.5 rounded pointer-events-none">
            Double-click to interact
          </div>
        </div>
      </HTMLContainer>
    );
  }
  
  // Indicator for selection
  override indicator(shape: BrowserShape) {
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
