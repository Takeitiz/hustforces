export interface LanguageConfig {
    name: string
    monaco: string
    internal: number
}

export const LANGUAGE_MAPPING: Record<string, LanguageConfig> = {
    cpp: { name: "C++", monaco: "cpp", internal: 2 },
    java: { name: "Java", monaco: "java", internal: 4 },
    javascript: { name: "JavaScript", monaco: "javascript", internal: 1 },
    rust: { name: "Rust", monaco: "rust", internal: 3 },
}

export function getLanguageName(languageIdentifier: number | string): string {
    if (typeof languageIdentifier === "string") {
        // If it's a string key (e.g., "cpp", "java")
        if (LANGUAGE_MAPPING[languageIdentifier]) {
            return LANGUAGE_MAPPING[languageIdentifier].name
        }
        // If it's a string that might represent a numeric ID (e.g., "1", "2")
        const parsedId = Number.parseInt(languageIdentifier)
        if (!isNaN(parsedId)) {
            const language = Object.keys(LANGUAGE_MAPPING).find((key) => LANGUAGE_MAPPING[key].internal === parsedId)
            return language ? LANGUAGE_MAPPING[language].name : "Unknown"
        }
    } else if (typeof languageIdentifier === "number") {
        // If it's a numeric internal ID
        const language = Object.keys(LANGUAGE_MAPPING).find((key) => LANGUAGE_MAPPING[key].internal === languageIdentifier)
        return language ? LANGUAGE_MAPPING[language].name : "Unknown"
    }
    return "Unknown" // Default for unknown types or values
}
