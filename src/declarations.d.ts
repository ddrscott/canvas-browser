// Add TypeScript declarations for non-standard HTML elements
declare namespace JSX {
  interface IntrinsicElements {
    // Define the webview element for Electron
    'webview': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      src?: string;
      partition?: string;
      allowpopups?: string;
      webpreferences?: string;
      nodeintegration?: string;
    }, HTMLElement>;
  }
}