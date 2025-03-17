import { StateNode } from '@tldraw/tldraw'
import { showSearchDialog, performExaSearch } from '../utils/exaSearch'

export class SearchTool extends StateNode {
  static override id = 'exaSearch'

  override onEnter() {
    this.editor.setCursor({ type: 'default', rotation: 0 })
    this.performSearch()
  }

  async performSearch() {
    try {
      // Show search dialog with new parameters
      const searchParams = await showSearchDialog()
      if (!searchParams) {
        console.log('Search dialog cancelled')
        // Return to default tool if search is cancelled
        this.editor.setCurrentTool('select')
        return
      }

      console.log('Search parameters:', searchParams)

      // Show loading notification that doesn't auto-hide (duration = 0)
      const notificationId = this.showNotification('Searching...', 'info', 0)

      const shapeWidth = 400
      const shapeHeight = 800

      // Use our extracted search function with the new parameters
      const exaResponse = await performExaSearch(
        searchParams.query,
        searchParams.apiKey,
        searchParams.numResults
      )

      this.hideNotification(notificationId)

      if (!exaResponse.results || exaResponse.results.length === 0) {
        this.showNotification('No search results found', 'info')
        // Return to default tool after search
        this.editor.setCurrentTool('select')
        return
      }

      // Calculate center of viewport
      const viewportBounds = this.editor.getViewportPageBounds()
      const centerX = viewportBounds ? viewportBounds.x + (viewportBounds.width / 2) : 0
      const centerY = viewportBounds ? viewportBounds.y + (viewportBounds.height / 2) : 0

      const gapX = shapeWidth * 0.1 // 10% gap between columns
      let startX = centerX - (((shapeWidth + gapX) * exaResponse.results.length) / 2)

      // Create individual shapes for each result
      exaResponse.results.forEach((result: any) => {
        const id = createShapeId()

        this.editor.createShape({
          id,
          type: 'exaSearchResult',
          x: startX,
          y: centerY - (shapeHeight / 2),
          props: {
            w: shapeWidth,
            h: shapeHeight,
            resultData: result,
            createdAt: Date.now()
          }
        })

        // Move to next position horizontally
        startX += shapeWidth + gapX
      })

      this.showNotification(`Created ${exaResponse.results.length} search result cards`, 'success')
      // Return to default tool after search
      this.editor.setCurrentTool('select')
    } catch (error: any) {
      console.error('Search failed:', error)
      this.showNotification(`Search failed: ${error.message || 'Unknown error'}`, 'error')
      // Return to default tool after error
      this.editor.setCurrentTool('select')
    }
  }

  // Helper function to show notification
  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000): string {
    // Generate a unique ID for this notification
    const id = 'notification-' + Date.now()

    // Create notification element
    const notification = document.createElement('div')
    notification.className = `notification notification-${type}`
    notification.id = id
    notification.textContent = message

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
    })

    // Set color based on type
    if (type === 'success') {
      notification.style.backgroundColor = '#4CAF50'
    } else if (type === 'error') {
      notification.style.backgroundColor = '#F44336'
    } else {
      notification.style.backgroundColor = '#2196F3'
    }

    // Add to DOM
    document.body.appendChild(notification)

    // Trigger animation
    setTimeout(() => {
      notification.style.opacity = '1'
    }, 10)

    // Remove after duration if duration > 0
    if (duration > 0) {
      setTimeout(() => {
        this.hideNotification(id)
      }, duration)
    }

    return id
  }

  // Helper function to hide notification
  hideNotification(id: string): void {
    const notification = document.getElementById(id)
    if (notification) {
      notification.style.opacity = '0'
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 300)
    }
  }
}

import { createShapeId } from '@tldraw/tldraw'