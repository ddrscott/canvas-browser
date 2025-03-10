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
    // Try to immediately save the webview state to ensure the current scroll position is preserved
    try {
      const webview = document.querySelector(`[data-shape-id="${shape.id}"] webview`) as any;
      if (webview) {
        webview.executeJavaScript(`
          {
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            html: document.documentElement.outerHTML,
            currentUrl: window.location.href
          }
        `).then((state: {scrollX: number, scrollY: number, html: string, currentUrl: string}) => {
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
        }).catch(err => console.error('Error saving webview state on edit end:', err));
      }
    } catch (err) {
      console.error('Failed to save webview state on edit end:', err);
    }
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
        webview.setAttribute('webpreferences', 'javascript=yes');
        
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
            // Preserve the current width and height to prevent resizing
            this.editor.updateShape({
              id: shape.id,
              type: 'browser',
              props: {
                ...shape.props,
                url: event.url,
                w: shape.props.w,
                h: shape.props.h
              }
            });
          }
        });
        
        // Also handle in-page navigation (hash changes, etc.)
        webview.addEventListener('did-navigate-in-page', (event: any) => {
          if (event.url) {
            setUrl(event.url);
            
            // Save the new URL to the shape
            // Preserve the current width and height to prevent resizing
            this.editor.updateShape({
              id: shape.id,
              type: 'browser',
              props: {
                ...shape.props,
                url: event.url,
                w: shape.props.w,
                h: shape.props.h
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
                  url: state.currentUrl,
                  w: shape.props.w,
                  h: shape.props.h
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
        
        // Capture webview state periodically (consistent timing regardless of edit mode)
        scrollHandler = setInterval(saveWebviewState, 750);
        
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
        className={isEditing ? 'tldraw-editing-container' : undefined}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          background: 'white',
          pointerEvents: 'all',
        }}
        onPointerDown={isEditing ? stopEventPropagation : undefined}
        onWheel={stopEventPropagation}
      >
        {/* Browser toolbar */}
        <div
          style={{
            height: '32px',
            background: '#f0f0f0',
            borderBottom: '1px solid #ddd',
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            width: '100%',
            position: 'relative',
          }}
        >
          {isEditing ? (
            // Interactive controls when editing
            <>
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
            </>
          ) : (
            // URL display when not editing
            <div
              style={{
                flex: 1,
                height: '22px',
                background: 'white',
                borderRadius: '11px',
                padding: '0 10px',
                fontSize: '12px',
                border: '1px solid #d0d0d0',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                margin: '0 20px',
              }}
            >
              {shape.props.url}
            </div>
          )}
        </div>
        
        {/* Webview and content area */}
        <div 
          style={{ 
            flex: 1, 
            position: 'relative',
          }}
        >
          {/* Webview container - always visible */}
          <div
            ref={webviewRef}
            data-shape-id={shape.id}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'all', // Always allow pointer events to the webview
            }}
          />
          
          {/* Interaction blocker when not in edit mode */}
          {!isEditing && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10,
                cursor: 'pointer',
                background: 'transparent', // Completely transparent
                pointerEvents: 'all', // Block all events and handle the double-click
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                this.editor.select(shape.id);
                this.editor.setEditingShape(shape.id);
              }}
            >
              {/* Help text */}
              <div style={{ 
                position: 'absolute', 
                bottom: '10px', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                fontSize: '12px',
                color: '#666',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                padding: '3px 8px',
                borderRadius: '4px',
                pointerEvents: 'none',
              }}>
                Double-click to interact
              </div>
            </div>
          )}
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