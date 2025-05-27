package com.hust.hustforces.service.impl;

import com.hust.hustforces.enums.UserRole;
import com.hust.hustforces.enums.UserStatus;
import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.mapper.UserMapper;
import com.hust.hustforces.model.dto.UserDto;
import com.hust.hustforces.model.dto.auth.AuthResponse;
import com.hust.hustforces.model.dto.auth.LoginRequest;
import com.hust.hustforces.model.dto.auth.RegisterRequest;
import com.hust.hustforces.model.entity.User;
import com.hust.hustforces.repository.UserRepository;
import com.hust.hustforces.security.JwtTokenProvider;
import com.hust.hustforces.service.AuthService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest registerRequest) {
        if (!registerRequest.getPassword().equals(registerRequest.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new IllegalArgumentException("Username is already taken");
        }

        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        // Build and save user
        User user = User.builder()
                .username(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();

        User savedUser = userRepository.save(user);

        // Generate token
        String token = tokenProvider.generateToken(savedUser.getUsername());

        UserDto userDto = userMapper.toUserDto(savedUser);

        return AuthResponse.builder()
                .token(token)
                .user(userDto)
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + loginRequest.getUsername()));

        String token = tokenProvider.generateToken(user.getUsername());

        UserDto userDto = userMapper.toUserDto(user);

        return AuthResponse.builder()
                .token(token)
                .user(userDto)
                .build();
    }

    @Override
    public UserDto getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        return userMapper.toUserDto(user);
    }
}
