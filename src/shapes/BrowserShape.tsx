/* eslint-disable react-hooks/rules-of-hooks */
import React from 'react';
import { 
  BaseBoxShapeUtil, 
  TLBaseShape, 
  useDelaySvgExport
} from '@tldraw/tldraw';

// Define the browser shape type
type BrowserShape = TLBaseShape<
  'browser',
  { 
    w: number;
    h: number;
    url: string;
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

  // Default props when created
  override getDefaultProps() {
    return {
      w: 600,
      h: 400,
      url: 'https://www.google.com'
    };
  }

  // Render the component
  override component(shape: BrowserShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id;
    const isReady = useDelaySvgExport();
    const isSelected = this.editor.getSelectedShapeIds().includes(shape.id);
    
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
      
      // Update the shape with the new URL
      this.editor.updateShape({
        id: shape.id,
        type: 'browser',
        props: {
          ...shape.props,
          url: url
        }
      });
      
      // Navigate the webview
      if (webviewRef.current) {
        const webview = webviewRef.current.querySelector('webview');
        if (webview) {
          (webview as any).loadURL(url);
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
    
    // Setup the webview on mount
    React.useEffect(() => {
      if (!webviewRef.current) return;
      
      // Clear previous content
      webviewRef.current.innerHTML = '';
      
      if (isReady) {
        // Create a webview element
        const webview = document.createElement('webview');
        
        // Configure webview like a regular browser tab
        webview.src = shape.props.url;
        webview.setAttribute('partition', 'persist:tldraw');
        webview.setAttribute('allowpopups', 'true');
        // Full access for embedded browser - simulating regular browser behavior
        webview.setAttribute('webpreferences', 'javascript=yes');
        // Removed sandbox to allow full browser capabilities
        
        // Style the webview
        webview.style.width = '100%';
        webview.style.height = '100%';
        webview.style.border = 'none';
        
        // Add logging and event handlers
        webview.addEventListener('did-start-loading', () => {
          console.log('Webview started loading:', shape.props.url);
        });
        
        webview.addEventListener('did-finish-load', () => {
          console.log('Webview finished loading:', shape.props.url);
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
          }
        });
        
        // Add to DOM
        webviewRef.current.appendChild(webview);
      }
    }, [isReady, shape.id]);
    
    // Always update URL state when props change
    React.useEffect(() => {
      setUrl(shape.props.url);
    }, [shape.props.url]);
    
    return (
      <div
        style={{
          width: shape.props.w,
          height: shape.props.h,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          background: 'white',
          // Always allow pointer events
          pointerEvents: 'all',
          position: 'relative',
        }}
        onClick={() => {
          // Ensure shape gets selected when clicking
          if (!isSelected) {
            this.editor.select(shape.id);
          }
        }}
      >
        {/* Browser toolbar */}
        <div
          style={{
            height: '32px',
            background: '#f0f0f0',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            borderBottom: '1px solid #ddd',
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            // Ensure toolbar can receive clicks
            pointerEvents: 'all',
          }}
        >
          {/* Back button */}
          <div
            onClick={handleBackClick}
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#ccc',
              marginRight: '5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
            }}
          >
            ←
          </div>
          {/* Forward button */}
          <div
            onClick={handleForwardClick}
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#ccc',
              marginRight: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
            }}
          >
            →
          </div>
          
          {/* URL bar */}
          <form 
            style={{ flex: 1 }}
            onSubmit={handleUrlSubmit}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={url}
              onChange={handleUrlChange}
              onKeyDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                height: '22px',
                background: 'white',
                borderRadius: '11px',
                padding: '0 10px',
                fontSize: '12px',
                border: '1px solid #d0d0d0',
                outline: 'none',
                color: '#666',
                boxSizing: 'border-box',
              }}
            />
          </form>
          
          {/* Refresh button */}
          <div
            onClick={handleRefreshClick}
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#ccc',
              marginLeft: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
            }}
          >
            ↻
          </div>
        </div>
        
        {/* Webview container */}
        <div
          ref={webviewRef}
          style={{
            flex: 1,
            width: '100%',
            height: 'calc(100% - 32px)',
            position: 'relative',
            // Ensure webview content can receive clicks
            pointerEvents: 'all',
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
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
