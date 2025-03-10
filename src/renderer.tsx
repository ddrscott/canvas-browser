/**
 * Renderer process for TLDraw Electron App
 */

import './index.css';
import '@tldraw/tldraw/tldraw.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { 
  DefaultSizeStyle,
  Tldraw, 
  createShapeId,
  Editor
} from '@tldraw/tldraw'
import { BrowserShapeUtil } from './shapes/BrowserShape'
import { MarkdownShapeUtil } from './shapes/MarkdownShape'
import { ScrollableShapeUtil } from './shapes/ScrollableShape'

/**
 * Calculate the position to place a shape at viewport center
 * @param editor The TLDraw editor instance
 * @param width Width of the shape to be centered
 * @param height Height of the shape to be centered
 * @returns {x, y} coordinates to place the shape
 */
function getPositionAtViewportCenter(editor: Editor, width: number, height: number) {
  let x = 0, y = 0;
  
  const viewportBounds = editor.getViewportPageBounds();

  if (viewportBounds) {
      const centerX = viewportBounds.width ? viewportBounds.x + (viewportBounds.width / 2) : viewportBounds.x;
      const centerY = viewportBounds.height ? viewportBounds.y + (viewportBounds.height / 2) : viewportBounds.y;

      x = centerX - (width / 2);
      y = centerY - (height / 2);
  }
  return { x, y };
}

DefaultSizeStyle.setDefaultValue('s')
// The main TLDraw application component
function TldrawBrowserApp() {

  return (
    <div className="tldraw__editor">
      <Tldraw 
        persistenceKey="tldraw-browser-electron-v2" 
        shapeUtils={[BrowserShapeUtil, MarkdownShapeUtil, ScrollableShapeUtil]}
        onMount={(editor) => {
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
        
        // Get position at viewport center
        const browserWidth = 600;
        const browserHeight = 400;
        const position = getPositionAtViewportCenter(editor, browserWidth, browserHeight);
        
        // Create a new browser shape
        const id = createShapeId();
        
        editor.createShape({
          id,
          type: 'browser',
          x: position.x,
          y: position.y,
          props: {
            w: browserWidth,
            h: browserHeight,
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
        
        // Get position at viewport center
        const markdownWidth = 400;
        const markdownHeight = 600;
        const position = getPositionAtViewportCenter(editor, markdownWidth, markdownHeight);
        
        // Create a new markdown shape
        const id = createShapeId();
        
        editor.createShape({
          id,
          type: 'markdown',
          x: position.x,
          y: position.y,
          props: {
            w: markdownWidth,
            h: markdownHeight,
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
      
      // Create scrollable button
      const scrollableButton = document.createElement('button');
      scrollableButton.className = 'scrollable-button';
      scrollableButton.innerHTML = '📜 Add Scrollable';
      scrollableButton.title = 'Insert Simple Scrollable Area';
      scrollableButton.style.marginLeft = '10px';
      scrollableButton.style.backgroundColor = '#9c27b0';
      scrollableButton.style.color = 'white';
      
      // Add scrollable button click event listener
      scrollableButton.addEventListener('click', () => {
        // Get the editor from the global we set
        const editor = (window as any).tldrawEditor;
        if (!editor) {
          console.error('TLDraw editor not found');
          return;
        }
        
        // Get position at viewport center
        const scrollableWidth = 400;
        const scrollableHeight = 300;
        const position = getPositionAtViewportCenter(editor, scrollableWidth, scrollableHeight);
        
        // Create a new scrollable shape
        const id = createShapeId();
        
        editor.createShape({
          id,
          type: 'scrollable',
          x: position.x,
          y: position.y,
          props: {
            w: scrollableWidth,
            h: scrollableHeight,
            text: 'This is a simple scrollable text area with basic text content. Try scrolling in both view and edit modes to see how it behaves.'
          }
        });
        
        // Select the newly created shape
        editor.select(id);
        
        // Start editing the shape immediately
        setTimeout(() => {
          editor.setEditingShape(id);
        }, 100);
        
        console.log('Scrollable shape added to canvas');
      });
      
      // Add buttons to container
      container.appendChild(browserButton);
      container.appendChild(markdownButton);
      container.appendChild(scrollableButton);
      
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
