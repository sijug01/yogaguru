/**
 * Response cleaner - Remove markdown and special characters
 * Convert formatted text to clean, plain text
 */

/**
 * Clean markdown and special characters from response text
 */
export function cleanResponse(text: string): string {
  return text
    // Remove markdown headers (# ## ###, etc.)
    .replace(/^#+\s+/gm, '')
    // Remove bold (**text** or __text__)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    // Remove italics (*text* or _text_)
    .replace(/\*([^\*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove inline code backticks (`code`)
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown links [text](url) → text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Remove bullet points at line start
    .replace(/^[\s]*[-*•]\s+/gm, '')
    // Remove numbered lists
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Remove horizontal rules (---, ***, ___)
    .replace(/^[\s]*(-{3,}|\*{3,}|_{3,})[\s]*$/gm, '')
    // Remove extra whitespace at start of lines
    .replace(/^[\s]+/gm, '')
    // Reduce multiple blank lines to max 2
    .replace(/\n{3,}/g, '\n\n')
    // Remove trailing whitespace from each line
    .replace(/[\s]+$/gm, '')
    // Trim overall
    .trim();
}

/**
 * Sanitize text for display - additional cleanup
 */
export function sanitizeForDisplay(text: string): string {
  return cleanResponse(text)
    // Replace multiple spaces with single space
    .replace(/  +/g, ' ')
    // Fix double newlines to be consistent
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

/**
 * Extract plain text from response, removing all formatting
 */
export function extractPlainText(text: string): string {
  let cleaned = cleanResponse(text);

  // Additional cleanup for common patterns
  cleaned = cleaned
    // Remove "Note:", "Note -", etc. but keep content
    .replace(/^(Note|WARNING|IMPORTANT)[\s:]*-?[\s]*/gm, '')
    // Remove parenthetical citations like (Source 1)
    .replace(/\s*\(Source\s+\d+\)\s*/g, ' ')
    // Remove curly braces and their content
    .replace(/\{[^}]+\}/g, '');

  // Normalize whitespace
  return sanitizeForDisplay(cleaned);
}
