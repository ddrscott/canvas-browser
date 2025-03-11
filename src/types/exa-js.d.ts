declare module 'exa-js' {
  export interface ExaSearchOptions {
    text?: {
      includeHtmlTags?: boolean;
    };
    summary?: {
      query?: string;
    };
  }

  export interface ExaSearchResult {
    id: string;
    title: string;
    url: string;
    author?: string;
    text?: string;
    summary?: string;
    image?: string;
    favicon?: string;
    publishedDate?: string;
  }

  export interface ExaResponse {
    requestId: string;
    autopromptString: string;
    resolvedSearchType: string;
    results: ExaSearchResult[];
    effectiveFilters: Record<string, any>;
    costDollars: Record<string, any>;
  }

  export default class Exa {
    constructor(apiKey: string);

    searchAndContents(
      query: string,
      options?: ExaSearchOptions
    ): Promise<ExaResponse>;

    search(query: string): Promise<ExaResponse>;
  }
}