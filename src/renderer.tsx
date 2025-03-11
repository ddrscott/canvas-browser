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
import { exportData, importData, selectFile } from './utils/exportImport'

/**
 * Button configuration for shape creation
 */
interface ShapeButtonConfig {
  type: string;
  emoji: string;
  label: string;
  tooltip: string;
  width: number;
  height: number;
  extraProps?: Record<string, any>;
  styles?: Record<string, string>;
  startEditing?: boolean;
}

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

/**
 * Create a button element for adding a specific shape type
 */
function createShapeButton(config: ShapeButtonConfig): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = `${config.type}-button`;
  button.innerHTML = `${config.emoji} ${config.label}`;
  button.title = config.tooltip;

  // Apply any additional styles
  if (config.styles) {
    Object.entries(config.styles).forEach(([property, value]) => {
      button.style[property as any] = value;
    });
  }

  // Add click event listener
  button.addEventListener('click', () => {
    createShape(config);
  });

  return button;
}

/**
 * Create a shape using the editor and shape configuration
 */
function createShape(config: ShapeButtonConfig) {
  const editor = (window as any).tldrawEditor;
  if (!editor) {
    console.error('TLDraw editor not found');
    return;
  }

  // Get position at viewport center
  const position = getPositionAtViewportCenter(editor, config.width, config.height);

  // Create a new shape
  const id = createShapeId();

  // Prepare the props object with the extraProps
  const props = {
    w: config.width,
    h: config.height,
    ...config.extraProps
  };

  // If it's a markdown shape, ensure we add the required createdAt property
  if (config.type === 'markdown') {
    props.createdAt = Date.now();
  }

  editor.createShape({
    id,
    type: config.type,
    x: position.x,
    y: position.y,
    props
  });

  // Select the newly created shape
  editor.select(id);

  // Start editing if needed
  if (config.startEditing) {
    setTimeout(() => {
      editor.setEditingShape(id);
    }, 100);
  }

  console.log(`${config.type} shape added to canvas`);
}

/**
 * Create a menu button with the given configuration
 */
function createMenuButton(label: string, onClick: () => void, styles?: Record<string, string>): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'menu-button';
  button.textContent = label;

  // Base styles for menu buttons
  const baseStyles = {
    padding: '6px 12px',
    margin: '0 5px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    background: '#f8f8f8',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#333',
  };

  // Apply base styles
  Object.entries(baseStyles).forEach(([property, value]) => {
    button.style[property as any] = value;
  });

  // Apply additional styles if provided
  if (styles) {
    Object.entries(styles).forEach(([property, value]) => {
      button.style[property as any] = value;
    });
  }

  // Add click event listener
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });

  return button;
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
 * Show a notification message
 */
function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
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

  // Remove after duration
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, duration);
}

DefaultSizeStyle.setDefaultValue('s')
// The main TLDraw application component
function TldrawBrowserApp() {
  return (
    <div className="tldraw__editor">
      <Tldraw
        persistenceKey="tldraw-browser-electron-v2"
        shapeUtils={[BrowserShapeUtil, MarkdownShapeUtil]}
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
      // Create shape buttons container
      const shapeContainer = document.createElement('div');
      shapeContainer.className = 'browser-button-container';

      // Define button configurations
      const buttonConfigs: ShapeButtonConfig[] = [
        {
          type: 'browser',
          emoji: '🌐',
          label: 'Web',
          tooltip: 'Insert Browser with Webview',
          width: 480,
          height: 800,
          extraProps: {
            url: 'https://www.google.com',
            scrollX: 0,
            scrollY: 0
          }
        },
        {
          type: 'markdown',
          emoji: '📝',
          label: 'MD',
          tooltip: 'Insert Markdown Note',
          width: 400,
          height: 600,
          extraProps: {
            createdAt: Date.now() // Ensure createdAt is passed when creating a markdown shape
          },
          startEditing: true,
          styles: {
            marginLeft: '1em'
          }
        }
      ];

      // Create and add buttons to container
      buttonConfigs.forEach(config => {
        const button = createShapeButton(config);
        shapeContainer.appendChild(button);
      });

      // Add shape container to document
      document.body.appendChild(shapeContainer);

      // Create menu container for export/import
      const menuContainer = document.createElement('div');
      menuContainer.className = 'menu-container';

      // Style the menu container
      Object.assign(menuContainer.style, {
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: '9999',
        display: 'flex',
        background: 'white',
        padding: '5px',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      });

      // Create and add export button
      const exportButton = createMenuButton('Export Data', handleExport);
      menuContainer.appendChild(exportButton);

      // Create and add import button
      const importButton = createMenuButton('Import Data', handleImport);
      menuContainer.appendChild(importButton);

      // Add menu container to document
      document.body.appendChild(menuContainer);
    }, 100); // Delay for 100ms
  }
});