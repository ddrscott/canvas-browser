import { StateNode, createShapeId } from '@tldraw/tldraw'

export class MarkdownTool extends StateNode {
  static override id = 'markdown'

  override onEnter() {
    this.editor.setCursor({ type: 'cross', rotation: 0 })
  }

  override onPointerDown() {
    const { currentPagePoint } = this.editor.inputs

    const id = createShapeId()
    this.editor.createShape({
      id,
      type: 'markdown',
      x: currentPagePoint.x - 200, // Half of width
      y: currentPagePoint.y - 300, // Half of height
      props: {
        w: 400,
        h: 600,
        text: '# Markdown Note\n\nThis is a **markdown** note with code highlighting support!',
        createdAt: Date.now()
      }
    })

    // Select the newly created shape and start editing
    setTimeout(() => {
      this.editor.setEditingShape(id)
    }, 100)
  }
}
