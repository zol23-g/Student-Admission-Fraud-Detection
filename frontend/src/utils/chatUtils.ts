// utils/chatUtils.ts
import { QueryResultRow} from "./queryResultRow";

export const safeJsonParse = (
  str: string | QueryResultRow[] | undefined | null
): QueryResultRow[] | string | null => {
  if (!str || typeof str !== "string") return str || null;

  try {
    const cleanedStr = str
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t");

    return JSON.parse(cleanedStr) as QueryResultRow[];
  } catch (e) {
    console.error("Failed to parse JSON:", str, e);
    return null;
  }
};

export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    const tooltip = document.createElement("div");
    tooltip.className = "fixed bg-gray-800 text-white text-sm px-2 py-1 rounded-md shadow-lg";
    tooltip.textContent = "Copied!";
    tooltip.style.top = `${window.scrollY + 50}px`;
    tooltip.style.left = `${window.innerWidth / 2 - 30}px`;
    document.body.appendChild(tooltip);
    
    setTimeout(() => {
      document.body.removeChild(tooltip);
    }, 1500);
  });
};