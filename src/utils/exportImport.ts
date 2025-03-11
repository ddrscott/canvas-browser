import JSZip from 'jszip';
import { Editor, TLRecord, StoreSnapshot } from '@tldraw/tldraw';

/**
 * Export TLDraw data to a zip file
 * @param editor The TLDraw editor instance
 */
export async function exportData(editor: Editor) {
  try {
    // Get the current store snapshot
    const snapshot = editor.store.getSnapshot();

    // Create JSON string of the snapshot
    const snapshotJson = JSON.stringify(snapshot, null, 2);

    // Create a zip file containing the snapshot
    const zip = new JSZip();

    // Add the main snapshot file
    zip.file('tldraw-snapshot.json', snapshotJson);

    // Generate zip file blob
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Create download link
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tldraw-export-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);

    return true;
  } catch (error) {
    console.error('Error exporting data:', error);
    return false;
  }
}

/**
 * Import TLDraw data from a zip file
 * @param editor The TLDraw editor instance
 * @param file The zip file to import
 */
export async function importData(editor: Editor, file: File): Promise<boolean> {
  try {
    // Read the zip file
    const zipData = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(zipData);

    // Find the snapshot file
    const snapshotFile = zip.file('tldraw-snapshot.json');

    if (!snapshotFile) {
      throw new Error('Invalid export file: snapshot file not found');
    }

    // Read the snapshot file
    const snapshotJson = await snapshotFile.async('string');
    const snapshot = JSON.parse(snapshotJson) as StoreSnapshot<TLRecord>;

    // Validate the snapshot (basic check)
    if (!snapshot || typeof snapshot !== 'object') {
      throw new Error('Invalid snapshot format');
    }

    // Clear current state and load the snapshot
    editor.store.loadSnapshot(snapshot);

    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}

/**
 * Create an invisible file input element and return the selected file
 * @returns Promise that resolves with the selected file
 */
export function selectFile(): Promise<File | null> {
  return new Promise(resolve => {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    input.style.display = 'none';

    // Set up callback for when a file is selected
    input.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      const file = files?.[0] || null;
      resolve(file);
      document.body.removeChild(input);
    };

    // Handle cancellation
    window.addEventListener('focus', function onFocus() {
      setTimeout(() => {
        if (document.body.contains(input) && !input.files?.length) {
          resolve(null);
          document.body.removeChild(input);
        }
        window.removeEventListener('focus', onFocus);
      }, 300);
    }, { once: false });

    // Add to DOM and trigger click
    document.body.appendChild(input);
    input.click();
  });
}
