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
      // Create container
      const container = document.createElement('div');
      container.className = 'browser-button-container';

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
        container.appendChild(button);
      });

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