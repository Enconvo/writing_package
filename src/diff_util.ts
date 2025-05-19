import { diffChars } from "diff";

export function getDiffHtml(text1: string, text2: string): string {
    const diffs = diffChars(text1, text2);
    let html = '';
    // Iterate through each diff part and generate HTML with styling
    for (const part of diffs) {
        if (part.added) {
            // Added text gets green color with no text decoration
            html += `<ins style="color:rgb(100,187,97); background-color:rgba(100,187,97, 0.1); text-decoration: none">${part.value}</ins>`; // Add green background with 0.1 opacity for added text
        } else if (part.removed) {
            // Removed text gets red color with strikethrough
            html += `<del style="color:rgb(235,77,62); background-color:rgba(235,77,62, 0.1); text-decoration: line-through">${part.value}</del>`; // Use rgba to set red background with 0.1 opacity
        } else {
            // Unchanged text is rendered normally in black
            html += `<span >${part.value}</span>`;
        }
    }
    return html;
}