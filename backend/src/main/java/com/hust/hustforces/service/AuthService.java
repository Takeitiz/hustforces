package com.hust.hustforces.service;

import com.hust.hustforces.model.dto.UserDto;
import com.hust.hustforces.model.dto.auth.AuthResponse;
import com.hust.hustforces.model.dto.auth.LoginRequest;
import com.hust.hustforces.model.dto.auth.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest registerRequest);
    AuthResponse login(LoginRequest loginRequest);
    UserDto getCurrentUser();
}
