package com.hust.hustforces.utils;

import com.hust.hustforces.model.dto.Judge0Language;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Component
public class LanguageMapping {
    private static final Map<String, Judge0Language> LANGUAGE_MAPPING = new HashMap<>();

    static {
        LANGUAGE_MAPPING.put("js", new Judge0Language(63, 1, "Javascript", "javascript"));
        LANGUAGE_MAPPING.put("cpp", new Judge0Language(54, 2, "C++", "cpp"));
        LANGUAGE_MAPPING.put("rs", new Judge0Language(73, 3, "Rust", "rust"));
        LANGUAGE_MAPPING.put("java", new Judge0Language(62, 4, "Java", "java"));
    }

    public Judge0Language getMapping(String languageId) {
        return LANGUAGE_MAPPING.get(languageId);
    }

    public Set<String> getSupportedLanguages() {
        return LANGUAGE_MAPPING.keySet();
    }
}
