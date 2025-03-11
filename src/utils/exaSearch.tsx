import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
// We'll handle the import more safely
let Exa: any;
try {
  // Try dynamic import first for better compatibility
  Exa = require('exa-js').default;
} catch (e) {
  console.error('Error importing Exa:', e);
  // Fallback constructor for testing when package isn't available
  Exa = class FallbackExa {
    constructor(apiKey: string) {
      this.apiKey = apiKey;
      console.warn('Using fallback Exa implementation');
    }

    apiKey: string;

    async searchAndContents(query: string, options: any = {}) {
      console.log('Fallback search called with:', { query, options });
      // Return mock data for testing
      return {
        requestId: 'mock-id',
        autopromptString: query,
        resolvedSearchType: 'mock',
        results: [
          {
            id: 'result1',
            title: 'Example Result',
            url: 'https://example.com',
            text: '<p>This is a mock result because the Exa API could not be loaded.</p>',
            summary: 'Mock search result for testing purposes'
          }
        ],
        effectiveFilters: {},
        costDollars: { total: 0 }
      };
    }
  };
}

// Constants for localStorage
const EXA_API_KEY_STORAGE_KEY = 'exa-api-key';

/**
 * Save the Exa API key to localStorage
 * @param apiKey The API key to save
 */
export function saveExaApiKey(apiKey: string): void {
  if (apiKey) {
    localStorage.setItem(EXA_API_KEY_STORAGE_KEY, apiKey);
  }
}

/**
 * Get the saved Exa API key from localStorage
 * @returns The saved API key or an empty string if none is saved
 */
export function getSavedExaApiKey(): string {
  return localStorage.getItem(EXA_API_KEY_STORAGE_KEY) || '';
}

/**
 * Perform a search with the Exa API
 * @param query The search query
 * @param apiKey The Exa API key
 * @param numResults The number of results to return
 * @returns Promise resolving to the search results
 */
export async function performExaSearch(
  query: string,
  apiKey: string,
  numResults: number = 5
): Promise<any> {
  console.log('performExaSearch called with:', { query, numResults });

  if (!query || !apiKey) {
    throw new Error('Query and API key are required');
  }

  try {
    console.log('Creating Exa instance...');
    const exa = new Exa(apiKey);
    console.log('Exa instance created');

    console.log('Calling searchAndContents...');
    const result = await exa.searchAndContents(
      query,
      {
        text: {
          includeHtmlTags: true
        },
        summary: {
          query: "provide a short cheat sheet of steps."
        },
        numResults: numResults
      }
    );
    console.log('Search results received:', result);

    // Save the API key after successful search
    saveExaApiKey(apiKey);

    return result;
  } catch (error) {
    console.error('Error performing Exa search:', error);

    // Provide more detailed error information
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error);
    }

    throw new Error(`Exa search failed: ${errorMessage}`);
  }
}

interface SearchDialogProps {
  onSubmit: (data: { query: string; apiKey: string; numResults: number }) => void;
  onCancel: () => void;
}

/**
 * SearchDialog React component
 */
const SearchDialog: React.FC<SearchDialogProps> = ({ onSubmit, onCancel }) => {
  const [query, setQuery] = useState('How to access webdav through SFTPgo server');
  const [apiKey, setApiKey] = useState(getSavedExaApiKey());
  const [numResults, setNumResults] = useState(5);
  const [loading, setLoading] = useState(false);

  // Handle escape key to close dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && apiKey.trim()) {
      setLoading(true);
      onSubmit({
        query: query.trim(),
        apiKey: apiKey.trim(),
        numResults: numResults
      });
    }
  };

  return (
    <div
      className="search-modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="search-modal-content bg-white rounded-lg shadow-lg w-[500px] max-w-[90%] p-5" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-3">Exa Search</h2>
        <p className="text-sm text-gray-600 mb-4">
          Search for information and create a result card with the findings.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="query">
              Search Query:
            </label>
            <input
              id="query"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your search query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="apiKey">
              Exa API Key:
            </label>
            <input
              id="apiKey"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your Exa API key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <div className="text-xs text-gray-500 mt-1">
              Get your API key at <a href="#" className="text-blue-500">https://exa.ai</a>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="numResults">
              Number of Results:
            </label>
            <input
              id="numResults"
              type="number"
              min="1"
              max="25"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Number of results"
              value={numResults}
              onChange={(e) => setNumResults(parseInt(e.target.value) || 5)}
            />
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 bg-blue-500 text-white rounded-md transition-colors ${
                !apiKey.trim() || loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
              }`}
              disabled={!apiKey.trim() || loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Show a dialog to get the user's search query and Exa API key
 * @returns Promise resolving to the query, API key, and number of results, or null if cancelled
 */
export function showSearchDialog(): Promise<{ query: string; apiKey: string; numResults: number } | null> {
  return new Promise((resolve) => {
    // Create container for our React component
    const container = document.createElement('div');
    document.body.appendChild(container);

    const root = ReactDOM.createRoot(container);

    // Function to unmount and clean up
    const cleanUp = () => {
      root.unmount();
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    };

    // Render the dialog
    root.render(
      <SearchDialog
        onSubmit={(data) => {
          console.log('Search dialog submitted with:', data);
          cleanUp();
          resolve(data);
        }}
        onCancel={() => {
          console.log('Search dialog cancelled');
          cleanUp();
          resolve(null);
        }}
      />
    );
  });
}