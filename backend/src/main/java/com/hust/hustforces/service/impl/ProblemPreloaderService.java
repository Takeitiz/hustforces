package com.hust.hustforces.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.core.env.Environment;

/**
 * Service to preload problems at application startup
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProblemPreloaderService {

    private final ProblemServiceImpl problemService;
    private final Environment environment;

    /**
     * Preload problems when application is ready
     */
    @EventListener(ApplicationReadyEvent.class)
    public void preloadProblems() {
        // Check if preloading is enabled
        if (isPreloadingEnabled()) {
            log.info("Starting problem preloading...");

            // Run preloading in a separate thread to not block application startup
            Thread preloadThread = new Thread(() -> {
                try {
                    problemService.preloadAllProblems();
                    log.info("Problem preloading completed");
                } catch (Exception e) {
                    log.error("Error during problem preloading", e);
                }
            });

            preloadThread.setName("problem-preloader");
            preloadThread.setDaemon(true);
            preloadThread.start();
        } else {
            log.info("Problem preloading is disabled");
        }
    }

    /**
     * Check if preloading is enabled in configuration
     */
    private boolean isPreloadingEnabled() {
        return Boolean.parseBoolean(
                environment.getProperty("problem.preloading.enabled", "true"));
    }
}
