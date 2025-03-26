/**
 * Renderer process for TLDraw Electron App
 */

import './index.css';
import '@tldraw/tldraw/tldraw.css'
// Fix the icon imports to use consistent approach and correct paths
import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  Tldraw,
  DefaultToolbar,
  DefaultToolbarContent,
  createShapeId
} from '@tldraw/tldraw'
import { BrowserShapeUtil } from './shapes/BrowserShape'
import { MarkdownShapeUtil } from './shapes/MarkdownShape'
import { ExaSearchResultShapeUtil } from './shapes/ExaSearchResultShape'
import { exportData, importData, selectFile } from './utils/exportImport'
import { BrowserTool } from './tools/BrowserTool'
import { MarkdownTool } from './tools/MarkdownTool'
import { SearchTool } from './tools/SearchTool'

import IconBrowser from '@public/icon-browser.svg'
import IconMarkdown from '@public/icon-markdown.svg'
import IconSearch from '@public/icon-search.svg'

/**
 * Show a notification message with customizable auto-hide behavior
 * @param message The message to display
 * @param type The notification type (success, error, info)
 * @param duration Duration in ms before auto-hiding (0 for no auto-hide)
 * @returns An ID that can be used to manually dismiss the notification
 */
function showNotification(
  message: string,
  type: 'success' | 'error' | 'info' = 'info',
  duration = 3000
): string {
  // Generate a unique ID for this notification
  const id = 'notification-' + Date.now();

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.id = id;
  notification.textContent = message;

  // Style the notification
  Object.assign(notification.style, {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 20px',
    borderRadius: '4px',
    color: 'white',
    zIndex: '10000',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    opacity: '0',
    transition: 'opacity 0.3s ease',
  });

  // Set color based on type
  if (type === 'success') {
    notification.style.backgroundColor = '#4CAF50';
  } else if (type === 'error') {
    notification.style.backgroundColor = '#F44336';
  } else {
    notification.style.backgroundColor = '#2196F3';
  }

  // Add to DOM
  document.body.appendChild(notification);

  // Trigger animation
  setTimeout(() => {
    notification.style.opacity = '1';
  }, 10);

  // Remove after duration if duration > 0
  if (duration > 0) {
    setTimeout(() => {
      hideNotification(id);
    }, duration);
  }

  return id;
}

/**
 * Hide and remove a notification by its ID
 * @param id The notification ID to hide
 */
function hideNotification(id: string): void {
  const notification = document.getElementById(id);
  if (notification) {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }
}

/**
 * Handle export action - export canvas data to a zip file
 */
async function handleExport() {
  const editor = (window as any).tldrawEditor;
  if (!editor) {
    console.error('TLDraw editor not found');
    return;
  }

  const success = await exportData(editor);

  if (success) {
    // Show success notification
    showNotification('Export successful', 'success');
  } else {
    // Show error notification
    showNotification('Export failed', 'error');
  }
}

/**
 * Handle import action - import canvas data from a zip file
 */
async function handleImport() {
  const editor = (window as any).tldrawEditor;
  if (!editor) {
    console.error('TLDraw editor not found');
    return;
  }

  // Show file selection dialog
  const file = await selectFile();

  if (!file) {
    console.log('Import cancelled');
    return;
  }

  // Import the data
  const success = await importData(editor, file);

  if (success) {
    // Show success notification
    showNotification('Import successful', 'success');
  } else {
    // Show error notification
    showNotification('Import failed', 'error');
  }
}

/**
 * Create a circular button for the floating menu
 */
function createCircularButton(
  emoji: string,
  tooltip: string,
  onClick: () => void,
  bgColor: string = '#ffffff'
): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'circular-button';
  button.innerHTML = emoji;
  button.title = tooltip;
  button.style.backgroundColor = bgColor;

  // Add click event listener
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });

  return button;
}

// Define custom tools to use in TLDraw
const customTools = [BrowserTool, MarkdownTool, SearchTool];

// Custom toolbar component to include our tools
function CustomToolbar() {
  return (
    <DefaultToolbar>
        <button className='btn px-2' onClick={() => window.tldrawEditor.setCurrentTool('browser')}><img src={IconBrowser} alt='Browser' /></button>
        <button className='btn px-2' onClick={() => window.tldrawEditor.setCurrentTool('markdown')}><img src={IconMarkdown} alt='Markdown' /></button>
        <button className='btn px-2' onClick={() => window.tldrawEditor.setCurrentTool('exaSearch')}><img src={IconSearch} alt='Search' /></button>
      <DefaultToolbarContent />
    </DefaultToolbar>
  );
}

// The main TLDraw application component
function TldrawBrowserApp() {
  return (
    <div className="tldraw__editor">
      <Tldraw
        persistenceKey="tldraw-browser-electron-v2"
        shapeUtils={[
          BrowserShapeUtil,
          MarkdownShapeUtil,
          ExaSearchResultShapeUtil
        ]}
        tools={customTools}
        components={{
          Toolbar: CustomToolbar
        }}
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
      // Create reduced floating menu container (only for Export/Import)
      const floatingMenu = document.createElement('div');
      floatingMenu.className = 'floating-menu';
      document.body.appendChild(floatingMenu);

      // Add export button
      const exportButton = createCircularButton(
        'Export',
        'Export Data',
        handleExport,
        '#f8f8f8'
      );
      exportButton.style.fontSize = '.75em';
      floatingMenu.appendChild(exportButton);

      // Add import button
      const importButton = createCircularButton(
        'Import',
        'Import Data',
        handleImport,
        '#f8f8f8'
      );
      importButton.style.fontSize = '.75em';
      floatingMenu.appendChild(importButton);

      console.log('UI buttons initialized');
    }, 500); // Increase delay to ensure everything is loaded
  }
});


window.electronAPI.onNewWindow((data:any) => {
  //console.log('New window event:', data)
  const editor = (window as any).tldrawEditor;
  if (!editor) {
    console.error('TLDraw editor not found');
    return;
  }
  const {url} = data;
  const { currentPagePoint } = editor.inputs

  const id = createShapeId()
  editor.createShape({
    id,
    type: 'browser',
    x: currentPagePoint.x,
    y: currentPagePoint.y,
    props: {
      w: 480,
      h: 800,
      url: url,
      scrollX: 0,
      scrollY: 0
    }
  })

  setTimeout(() => {
    editor.setCurrentTool('select')
  }, 10)
})

