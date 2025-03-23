export interface LanguageConfig {
    name: string
    monaco: string
    internal: number
}

export const LANGUAGE_MAPPING: Record<string, LanguageConfig> = {
    cpp: { name: 'C++', monaco: 'cpp', internal: 2 },
    java: { name: 'Java', monaco: 'java', internal: 4 },
    javascript: { name: 'JavaScript', monaco: 'javascript', internal: 1 },
    rust: { name: 'Rust', monaco: 'rust', internal: 3 }
};

export function getLanguageName(languageId: number): string {
    const language = Object.keys(LANGUAGE_MAPPING).find(
        key => LANGUAGE_MAPPING[key].internal === languageId
    );
    return language ? LANGUAGE_MAPPING[language].name : 'Unknown';
}