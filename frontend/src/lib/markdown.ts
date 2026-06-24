const IMAGE_PLACEHOLDER = "<!-- image -->";

// Docling exports one literal `<!-- image -->` placeholder per figure, in the same
// order as the document's extracted images. Swap each one for a markdown link our
// custom renderer recognizes, so clicking it opens the figure modal.
export function injectFigureLinks(markdown: string, imageCount: number): string {
  let index = 0;
  return markdown.replace(new RegExp(IMAGE_PLACEHOLDER, "g"), () => {
    const link = index < imageCount ? `[\u{1F5BC}️ View figure ${index + 1}](figure:${index})` : "";
    index += 1;
    return link;
  });
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\n+/g, " ")
    .trim();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

// Truncates by markdown "blocks" (paragraphs/headings/etc. separated by a blank
// line) rather than by raw character count, so we don't cut off mid-table or
// mid-list and break rendering.
export function truncateMarkdownBlocks(
  markdown: string,
  maxBlocks: number,
): { preview: string; isTruncated: boolean } {
  const blocks = markdown.split(/\n{2,}/);
  if (blocks.length <= maxBlocks) {
    return { preview: markdown, isTruncated: false };
  }
  return { preview: blocks.slice(0, maxBlocks).join("\n\n"), isTruncated: true };
}
