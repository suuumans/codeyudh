
/**
 * Gets the language name based on its ID.
 * @param languageId The ID of the language.
 * @returns The name of the language, or "Unknown" if the ID is not found.
 */
function getLanguageName(languageId: number): string {
  const LANGUAGE_NAMES: { [key: number]: string } = {
    74: "TypeScript",
    63: "JavaScript",
    71: "Python",
    62: "Java",
  };
  return LANGUAGE_NAMES[languageId] || "Unknown";
}

/**
 * Gets the language ID based on its name.
 * @param language The name of the language.
 * @returns The ID of the language, or undefined if not found.
 */
function getLanguageId(language: string): number | undefined {
  const languageMap: { [key: string]: number } = {
    "PYTHON": 71,
    "JAVASCRIPT": 63,
    "JAVA": 62,
    "TYPESCRIPT": 74,
  };
  return languageMap[language.toUpperCase()];
}

export { getLanguageName, getLanguageId };
