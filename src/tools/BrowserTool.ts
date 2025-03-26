import { StateNode, createShapeId } from '@tldraw/tldraw'

export class BrowserTool extends StateNode {
  static override id = 'browser'

  override onEnter() {
    this.editor.setCursor({ type: 'cross', rotation: 0 })
  }

  override onPointerDown() {
    const { currentPagePoint } = this.editor.inputs

    const id = createShapeId()
    this.editor.createShape({
      id,
      type: 'browser',
      x: currentPagePoint.x,
      y: currentPagePoint.y,
      props: {
        w: 480,
        h: 800,
        url: 'https://www.google.com',
        scrollX: 0,
        scrollY: 0
      }
    })

    // Select the newly created shape and start editing
    setTimeout(() => {
      this.editor.setCurrentTool('select')
    }, 10)
  }
}
