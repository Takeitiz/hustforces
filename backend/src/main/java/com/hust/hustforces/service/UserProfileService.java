package com.hust.hustforces.service;

import com.hust.hustforces.model.dto.profile.UserProfileDto;

public interface UserProfileService {
    UserProfileDto getUserProfile(String username);
    UserProfileDto getCurrentUserProfile();
}
