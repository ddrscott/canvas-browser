import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Exa from "exa-js"

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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 999999
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          width: '500px',
          maxWidth: '90%',
          padding: '20px'
        }}
        onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Exa Search</h2>
        <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
          Search for information and create a result card with the findings.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }} htmlFor="query">
              Search Query:
            </label>
            <input
              id="query"
              type="text"
              style={{ 
                width: '100%', 
                padding: '0.5rem 0.75rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.375rem',
                outline: 'none'
              }}
              placeholder="Enter your search query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }} htmlFor="apiKey">
              Exa API Key:
            </label>
            <input
              id="apiKey"
              type="password"
              style={{ 
                width: '100%', 
                padding: '0.5rem 0.75rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.375rem',
                outline: 'none'
              }}
              placeholder="Enter your Exa API key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Get your API key at <a href="#" style={{ color: '#3b82f6' }}>https://exa.ai</a>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }} htmlFor="numResults">
              Number of Results:
            </label>
            <input
              id="numResults"
              type="number"
              min="1"
              max="25"
              style={{ 
                width: '100%', 
                padding: '0.5rem 0.75rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.375rem',
                outline: 'none'
              }}
              placeholder="Number of results"
              value={numResults}
              onChange={(e) => setNumResults(parseInt(e.target.value) || 5)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: '#e5e7eb', 
                color: '#1f2937', 
                borderRadius: '0.375rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: '#3b82f6', 
                color: 'white', 
                borderRadius: '0.375rem',
                border: 'none',
                opacity: !apiKey.trim() || loading ? 0.5 : 1,
                cursor: !apiKey.trim() || loading ? 'not-allowed' : 'pointer'
              }}
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
