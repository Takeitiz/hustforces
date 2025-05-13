package com.hust.hustforces.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hust.hustforces.repository.SubmissionRepository;
import com.hust.hustforces.repository.UserRepository;
import com.hust.hustforces.repository.UserStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserStatsCalculationService {
    private final UserRepository userRepository;
    private final UserStatsRepository userStatsRepository;
    private final SubmissionRepository submissionRepository;
    private final ObjectMapper objectMapper;
    private final UserProfileCacheService cacheService;

    
}
