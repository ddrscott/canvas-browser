/**
 * Renderer process for TLDraw Electron App
 */

import './index.css';
import '@tldraw/tldraw/tldraw.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  Tldraw,
  createShapeId,
  Editor
} from '@tldraw/tldraw'
import { BrowserShapeUtil } from './shapes/BrowserShape'
import { MarkdownShapeUtil } from './shapes/MarkdownShape'
import { ExaSearchResultShapeUtil } from './shapes/ExaSearchResultShape'
import { exportData, importData, selectFile } from './utils/exportImport'
import { performExaSearch, showSearchDialog } from './utils/exaSearch'

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
  const props:any = {
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
 * Handle the search action - create individual shapes for each result
 */
async function handleSearch() {
  console.log('Exa Search button clicked');
  const editor = (window as any).tldrawEditor;
  if (!editor) {
    console.error('TLDraw editor not found');
    showNotification('Editor not found', 'error');
    return;
  }

  try {
    // Show search dialog with new parameters
    const searchParams = await showSearchDialog();
    if (!searchParams) {
      console.log('Search dialog cancelled');
      return;
    }

    console.log('Search parameters:', searchParams);

    // Show loading notification that doesn't auto-hide (duration = 0)
    const notificationId = showNotification('Searching...', 'info', 0);

    const shapeWidth = 400;
    const shapeHeight = 800;

    // Use our extracted search function with the new parameters
    const exaResponse = await performExaSearch(
      searchParams.query,
      searchParams.apiKey,
      searchParams.numResults
    );

    hideNotification(notificationId);

    console.log('Search results:', exaResponse);

    const position = getPositionAtViewportCenter(editor, shapeWidth, shapeHeight);

    if (!exaResponse.results || exaResponse.results.length === 0) {
      showNotification('No search results found', 'info');
      return;
    }

    const gapX = shapeWidth * 0.1; // 10% gap between columns

    let startX = position.x;

    // Create individual shapes for each result
    exaResponse.results.forEach((result:any, index:number) => {
      const id = createShapeId();
      console.log(`Creating result shape ${index + 1}:`, { id, x: startX, y: position.y });

      editor.createShape({
        id,
        type: 'exaSearchResult',
        x: startX,
        y: position.y,
        props: {
          w: shapeWidth,
          h: shapeHeight,
          resultData: result,
          createdAt: Date.now()
        }
      });

      // Move to next position horizontally
      startX += shapeWidth + gapX;
    });

    showNotification(`Created ${exaResponse.results.length} search result cards`, 'success');
  } catch (error: any) {
    console.error('Search failed:', error);
    showNotification(`Search failed: ${error.message || 'Unknown error'}`, 'error');
  }
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
          ExaSearchResultShapeUtil // Add the new shape util here
        ]}
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
      // Create consolidated floating menu container
      const floatingMenu = document.createElement('div');
      floatingMenu.className = 'floating-menu';
      document.body.appendChild(floatingMenu);

      // Define button configurations for shape creation
      const shapeConfigs: ShapeButtonConfig[] = [
        {
          type: 'browser',
          emoji: '🌐',
          label: 'Web',
          tooltip: 'Add Browser',
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
          tooltip: 'Add Markdown Note',
          width: 400,
          height: 600,
          extraProps: {
            createdAt: Date.now()
          },
          startEditing: true
        }
      ];

      // Add browser button
      const browserButton = createCircularButton(
        '🌐',
        'Add Browser',
        () => createShape(shapeConfigs[0]),
        '#2f80ed'
      );
      floatingMenu.appendChild(browserButton);

      // Add markdown button
      const markdownButton = createCircularButton(
        '📝',
        'Add Markdown Note',
        () => createShape(shapeConfigs[1]),
        '#34a853'
      );
      floatingMenu.appendChild(markdownButton);

      // Add search button
      const searchButton = createCircularButton(
        '🔍',
        'Exa Search',
        handleSearch,
        '#4a86e8'
      );
      floatingMenu.appendChild(searchButton);

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
