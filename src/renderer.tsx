/**
 * Renderer process for TLDraw Electron App
 */

import './index.css';
import '@tldraw/tldraw/tldraw.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { 
  Tldraw, 
  createShapeId
} from '@tldraw/tldraw'
import { BrowserShapeUtil } from './shapes/BrowserShape'
import { MarkdownShapeUtil } from './shapes/MarkdownShape'

// The main TLDraw application component
function TldrawBrowserApp() {
  return (
    <div className="tldraw__editor">
      <Tldraw 
        persistenceKey="tldraw-browser-electron-v2" 
        shapeUtils={[BrowserShapeUtil, MarkdownShapeUtil]}
        onMount={(editor) => {
          // Create a browser shape ID
          const browserShapeId = createShapeId('browser')
          
          // Only create the shape if it doesn't exist yet
          if (!editor.getShape(browserShapeId)) {
            // Create a browser shape at startup with safe positioning
            let x = 100, y = 100;
            try {
              const viewportBounds = editor.getViewportPageBounds();
              if (viewportBounds && 
                  typeof viewportBounds.centerX === 'number' && 
                  !isNaN(viewportBounds.centerX) &&
                  typeof viewportBounds.centerY === 'number' && 
                  !isNaN(viewportBounds.centerY)) {
                x = viewportBounds.centerX - 300;
                y = viewportBounds.centerY - 200;
              }
            } catch (err) {
              console.log('Using default browser position', err);
            }
            
            editor.createShape({
              id: browserShapeId,
              type: 'browser',
              x,
              y,
              props: {
                w: 600,
                h: 400,
                url: 'https://www.google.com'
              }
            })
            
            // Select the shape and zoom to it
            editor.select(browserShapeId)
            editor.zoomToSelection()
            console.log('Browser shape created at startup')
          }
          
          // Store editor in a global so we can access it from the button
          if (typeof window !== 'undefined') {
            (window as any).tldrawEditor = editor
          }
        }}
      />
    </div>
  )
}

// Initialize TLDraw when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const appElement = document.getElementById('app');

  if (appElement) {
    // Create a React root and render the TLDraw component
    const root = ReactDOM.createRoot(appElement)
    root.render(React.createElement(TldrawBrowserApp))
    
    console.log('TLDraw browser app initialized successfully');
    
    // Create buttons and add them to the DOM after TLDraw is initialized
    setTimeout(() => {
      // Create container
      const container = document.createElement('div');
      container.className = 'browser-button-container';
      
      // Create browser button
      const browserButton = document.createElement('button');
      browserButton.className = 'browser-button';
      browserButton.innerHTML = '🌐 Add Browser';
      browserButton.title = 'Insert Browser with Webview';
      
      // Add browser button click event listener
      browserButton.addEventListener('click', () => {
        // Get the editor from the global we set
        const editor = (window as any).tldrawEditor;
        if (!editor) {
          console.error('TLDraw editor not found');
          return;
        }
        
        // Get the current viewport center point with fallback
        let x = 100, y = 100;
        try {
          const viewportBounds = editor.getViewportPageBounds();
          if (viewportBounds && 
              typeof viewportBounds.centerX === 'number' && 
              !isNaN(viewportBounds.centerX) &&
              typeof viewportBounds.centerY === 'number' && 
              !isNaN(viewportBounds.centerY)) {
            x = viewportBounds.centerX - 300; // Center horizontally
            y = viewportBounds.centerY - 200; // Center vertically
          }
        } catch (err) {
          console.error('Error getting viewport bounds, using default position', err);
        }
        
        // Create a new browser shape
        const id = createShapeId();
        
        editor.createShape({
          id,
          type: 'browser',
          x, // Use calculated or default x
          y, // Use calculated or default y
          props: {
            w: 600,
            h: 400,
            url: 'https://www.google.com'
          }
        });
        
        // Select the newly created shape
        editor.select(id);
        
        console.log('Browser shape added to canvas');
      });
      
      // Create markdown button
      const markdownButton = document.createElement('button');
      markdownButton.className = 'markdown-button';
      markdownButton.innerHTML = '📝 Add Markdown';
      markdownButton.title = 'Insert Markdown Note';
      markdownButton.style.marginLeft = '10px';
      
      // Add markdown button click event listener
      markdownButton.addEventListener('click', () => {
        // Get the editor from the global we set
        const editor = (window as any).tldrawEditor;
        if (!editor) {
          console.error('TLDraw editor not found');
          return;
        }
        
        // Get the current viewport center point with fallback
        let x = 100, y = 100;
        try {
          const viewportBounds = editor.getViewportPageBounds();
          if (viewportBounds && 
              typeof viewportBounds.centerX === 'number' && 
              !isNaN(viewportBounds.centerX) &&
              typeof viewportBounds.centerY === 'number' && 
              !isNaN(viewportBounds.centerY)) {
            x = viewportBounds.centerX - 200; // Center horizontally
            y = viewportBounds.centerY - 150; // Center vertically
          }
        } catch (err) {
          console.error('Error getting viewport bounds, using default position', err);
        }
        
        // Create a new markdown shape
        const id = createShapeId();
        
        editor.createShape({
          id,
          type: 'markdown',
          x, // Use calculated or default x
          y, // Use calculated or default y
          props: {
            w: 400,
            h: 300,
            text: '# Hello World\n\nThis is a markdown note. Edit me!'
          }
        });
        
        // Select the newly created shape
        editor.select(id);
        
        // Start editing the shape immediately
        setTimeout(() => {
          editor.setEditingShape(id);
        }, 100);
        
        console.log('Markdown shape added to canvas');
      });
      
      // Add buttons to container
      container.appendChild(browserButton);
      container.appendChild(markdownButton);
      
      // Add container to document
      document.body.appendChild(container);
    }, 1000); // Delay for 1 second
  }
});

// Handle window resize events to ensure TLDraw fits the window
window.addEventListener('resize', () => {
  const tldrawEditor = document.querySelector('.tldraw__editor');
  if (tldrawEditor) {
    console.log('Resizing TLDraw editor');
  }
});
