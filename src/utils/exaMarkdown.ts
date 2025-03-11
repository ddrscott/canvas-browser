/**
 * Utilities for converting Exa search results into formatted markdown
 */

interface ExaSearchResult {
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

interface ExaResponse {
  requestId: string;
  autopromptString: string;
  resolvedSearchType: string;
  results: ExaSearchResult[];
  effectiveFilters: Record<string, any>;
  costDollars: Record<string, any>;
}

/**
 * Convert a single Exa search result into formatted markdown
 * @param result The individual search result
 * @returns Formatted markdown string for this result
 */
export function formatSingleResultAsMarkdown(result: ExaSearchResult): string {
  let markdown = '';

  // Title with h1 as requested
  markdown += `# ${result.title || "Untitled"}\n\n`;

  // Add URL with link
  markdown += `[${result.url || ""}](${result.url || "#"})\n\n`;

  // Add favicon if available
  if (result.favicon) {
    markdown += `![](${result.favicon})\n\n`;
  }
  if (result.favicon) {
    markdown += `![](${result.favicon})\n\n`;
  }

  // Add published date if available
  if (result.publishedDate) {
    try {
      const date = new Date(result.publishedDate);
      markdown += `**Published:** ${date.toLocaleDateString()}\n\n`;
    } catch (e) {
      // If date parsing fails, use the raw string
      markdown += `**Published:** ${result.publishedDate}\n\n`;
    }
  }

  // Add author if available
  if (result.author) {
    markdown += `**Author:** ${result.author}\n\n`;
  }

  // Add summary section if available
  if (result.summary) {
    markdown += `<details open>\n<summary>\n${result.summary}\n</summary>\n`;
  }

  // Add the full HTML content if available, preserving HTML tags
  if (result.text) {
    markdown += `\n<p>\n${result.text}\n</p></details>\n`;
  }

  return markdown;
}

/**
 * Convert Exa search results into nicely formatted markdown
 * @param exaResponse The response from Exa API
 * @returns Formatted markdown string
 */
export function formatExaResultsAsMarkdown(exaResponse: ExaResponse): string {
  // Create title section with the search query
  const query = exaResponse.autopromptString || "Search results";
  let markdown = `# Exa Search: ${query}\n\n`;

  // If no results, show a message
  if (!exaResponse.results || exaResponse.results.length === 0) {
    markdown += "> No results found.\n\n";
    return markdown;
  }

  // Add info about number of results
  markdown += `*Found ${exaResponse.results.length} results*\n\n`;

  // Process each result into a card
  exaResponse.results.forEach((result, index) => {
    // Add separator between results
    if (index > 0) {
      markdown += "\n---\n\n";
    }

    // Title with link
    markdown += `## [${result.title || "Untitled"}](${result.url || "#"})\n\n`;

    // Add favicon and URL
    if (result.favicon) {
      markdown += `![](${result.favicon}) `;
    }
    markdown += `${result.url || ""}\n\n`;

    // Add published date if available
    if (result.publishedDate) {
      try {
        const date = new Date(result.publishedDate);
        markdown += `**Published:** ${date.toLocaleDateString()}\n\n`;
      } catch (e) {
        // If date parsing fails, use the raw string
        markdown += `**Published:** ${result.publishedDate}\n\n`;
      }
    }

    // Add author if available
    if (result.author) {
      markdown += `**Author:** ${result.author}\n\n`;
    }

    // Add summary section if available
    if (result.summary) {
      markdown += `<details>\n<summary>\n${result.summary}\n</summary>\n`;
    }

    // Add the content preview (keep HTML tags as per requirement)
    if (result.text) {
      markdown += `### Content\n\n${result.text}\n</details>\n`;
    }
  });

  // Add information about search cost if available
  if (exaResponse.costDollars) {
    try {
      const totalCost = exaResponse.costDollars.total || 0;
      markdown += `\n*Search cost: $${totalCost.toFixed(4)}*\n\n`;
    } catch (e) {
      // Ignore cost formatting errors
    }
  }

  return markdown;
}

/**
 * Format a raw JSON response as prettified markdown
 * This is useful for debugging or when you want to see the complete response
 * @param exaResponse The raw JSON response
 * @returns Markdown with formatted JSON
 */
export function formatRawExaResponse(exaResponse: any): string {
  let markdown = `# Exa Search Raw Response\n\n`;

  try {
    // Format the JSON with indentation for readability
    const formattedJson = JSON.stringify(exaResponse, null, 2);
    markdown += "```json\n" + formattedJson + "\n```\n";
  } catch (e) {
    markdown += "```\nError formatting JSON: " + e + "\n```\n";
  }

  return markdown;
}
