package com.hust.hustforces.controller;

import com.hust.hustforces.model.dto.profile.UserProfileDto;
import com.hust.hustforces.service.UserProfileService;
import com.hust.hustforces.utils.CurrentUserUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@Slf4j
public class UserProfileController {
    private final UserProfileService userProfileService;

    @GetMapping("/{username}")
    public ResponseEntity<UserProfileDto> getUserProfile(@PathVariable String username) {
        log.info("Getting profile for user: {}", username);
        UserProfileDto profile = userProfileService.getUserProfile(username);
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> getMyProfile() {
        log.info("Getting profile for current user");
        UserProfileDto profile = userProfileService.getCurrentUserProfile();
        return ResponseEntity.ok(profile);
    }
}
