package com.hust.hustforces.controller;

import com.hust.hustforces.model.dto.UserDto;
import com.hust.hustforces.model.dto.auth.AuthResponse;
import com.hust.hustforces.model.dto.auth.LoginRequest;
import com.hust.hustforces.model.dto.auth.RegisterRequest;
import com.hust.hustforces.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest registerRequest) {
        log.info("Registering user with username: {}", registerRequest.getUsername());
        AuthResponse authResponse = authService.register(registerRequest);
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        log.info("Authenticating user with username: {}", loginRequest.getUsername());
        AuthResponse authResponse = authService.login(loginRequest);
        return ResponseEntity.ok(authResponse);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser() {
        log.info("Getting current user details");
        UserDto userDto = authService.getCurrentUser();
        return ResponseEntity.ok(userDto);
    }
}