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
          scrollY: 0
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
    
    // Setup the webview on mount
    React.useEffect(() => {
      if (!webviewRef.current) return;
      
      // Clear previous content
      webviewRef.current.innerHTML = '';
      
      let scrollHandler: NodeJS.Timeout | null = null;
      
      if (isReady) {
        // Create a webview element
        const webview = document.createElement('webview');
        
        // Store the innerHTML content first if it exists
        const hasContent = shape.props.innerHTML && shape.props.innerHTML.length > 0;
        
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
          
          // Use innerHTML to restore state if available
          if (hasContent) {
            try {
              // Try to restore from innerHTML for faster restoration
              (webview as any).executeJavaScript(`
                // Don't fully replace document as that can cause issues
                // Just try to restore visible state
                try {
                  // Check if we're on same domain to avoid CORS issues
                  const storedDoc = new DOMParser().parseFromString(${JSON.stringify(shape.props.innerHTML)}, 'text/html');
                  
                  // Add any missing scripts or styles
                  const addMissingElements = (selector) => {
                    const currentElements = document.querySelectorAll(selector);
                    const storedElements = storedDoc.querySelectorAll(selector);
                    
                    storedElements.forEach(stored => {
                      let exists = false;
                      currentElements.forEach(current => {
                        if (current.outerHTML === stored.outerHTML) {
                          exists = true;
                        }
                      });
                      
                      if (!exists) {
                        document.head.appendChild(document.importNode(stored, true));
                      }
                    });
                  };
                  
                  // Add scripts and styles
                  addMissingElements('script');
                  addMissingElements('link');
                  addMissingElements('style');
                  
                  // Restore scroll position
                  window.scrollTo(${shape.props.scrollX || 0}, ${shape.props.scrollY || 0});
                } catch (e) {
                  console.error('Error restoring saved content:', e);
                  // Fallback to just restoring scroll position
                  window.scrollTo(${shape.props.scrollX || 0}, ${shape.props.scrollY || 0});
                }
              `);
            } catch (err) {
              console.error('Failed to restore innerHTML:', err);
            }
          } else if (shape.props.scrollX || shape.props.scrollY) {
            // Just restore scroll position if that's all we have
            (webview as any).executeJavaScript(`
              window.scrollTo(${shape.props.scrollX}, ${shape.props.scrollY});
            `);
          }
        });
        
        webview.addEventListener('did-fail-load', (event) => {
          console.error('Webview failed to load:', event);
        });
        
        webview.addEventListener('did-navigate', (event: any) => {
          if (event.url) {
            setUrl(event.url);
            
            // Save the new URL to the shape when navigation occurs
            this.editor.updateShape({
              id: shape.id,
              type: 'browser',
              props: {
                ...shape.props,
                url: event.url
              }
            });
          }
        });
        
        // Also handle in-page navigation (hash changes, etc.)
        webview.addEventListener('did-navigate-in-page', (event: any) => {
          if (event.url) {
            setUrl(event.url);
            
            // Save the new URL to the shape
            this.editor.updateShape({
              id: shape.id,
              type: 'browser',
              props: {
                ...shape.props,
                url: event.url
              }
            });
          }
        });
        
        // Save scroll position and content periodically
        const saveWebviewState = () => {
          // Capture scroll position and current URL
          (webview as any).executeJavaScript(`
            {
              scrollX: window.scrollX,
              scrollY: window.scrollY,
              html: document.documentElement.outerHTML,
              currentUrl: window.location.href
            }
          `).then((state: {scrollX: number, scrollY: number, html: string, currentUrl: string}) => {
            const needsUpdate = 
              state.scrollX !== shape.props.scrollX || 
              state.scrollY !== shape.props.scrollY ||
              state.currentUrl !== shape.props.url;
            
            // Only update if position or URL changed (to avoid unnecessary updates)
            if (needsUpdate) {
              // We store full HTML but only when scroll position changes
              // to avoid too many updates that could impact performance
              this.editor.updateShape({
                id: shape.id,
                type: 'browser',
                props: {
                  ...shape.props,
                  scrollX: state.scrollX,
                  scrollY: state.scrollY,
                  innerHTML: state.html,
                  url: state.currentUrl
                }
              });
            }
          }).catch(err => console.error('Error saving webview state:', err));
        };
        
        // Save scroll position when user scrolls
        webview.addEventListener('did-stop-loading', () => {
          // Set up scroll event listener in the webview
          (webview as any).executeJavaScript(`
            document.addEventListener('scroll', () => {
              // Use a custom event to notify the parent
              const event = new CustomEvent('browser-scrolled', {
                detail: { scrollX: window.scrollX, scrollY: window.scrollY }
              });
              window.dispatchEvent(event);
            }, { passive: true });
          `);
        });
        
        // Capture webview state periodically
        scrollHandler = setInterval(saveWebviewState, 2000);
        
        // Add to DOM
        webviewRef.current.appendChild(webview);
      }
      
      // Clean up interval on unmount
      return () => {
        if (scrollHandler) {
          clearInterval(scrollHandler);
        }
      };
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
          // Main container must remain clickable for selection
          pointerEvents: 'all', 
          position: 'relative',
          // Subtle visual indicator when not selected
          // opacity: isSelected ? 1 : 0.95,
          // Add transition for smooth appearance
          transition: 'box-shadow 0.2s ease, opacity 0.2s ease',
        }}
        onClick={() => {
          // Ensure shape gets selected when clicking
          if (!isSelected) {
            this.editor.select(shape.id);
          }
        }}
      >
        {/* Browser toolbar container with position relative for overlay */}
        <div style={{ position: 'relative', height: '32px' }}>
          {/* Actual toolbar */}
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
              width: '100%',
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
          
          {/* Invisible layer to block toolbar interactions when not selected */}
          {!isSelected && (
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
        
        {/* Webview container with wrapper to prevent events when not selected */}
        <div style={{ position: 'relative', flex: 1 }}>
          <div
            ref={webviewRef}
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              // Always allow pointer events on the webview itself
              pointerEvents: 'all',
            }}
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Invisible layer to block interactions when not selected */}
          {!isSelected && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                // This layer blocks all events when not selected
                zIndex: 10,
              }}
              onClick={(e) => {
                e.stopPropagation();
                this.editor.select(shape.id);
              }}
            />
          )}
        </div>
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
