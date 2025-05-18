package com.hust.hustforces.controller;

import com.hust.hustforces.enums.UserRole;
import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.dto.UserDto;
import com.hust.hustforces.model.entity.User;
import com.hust.hustforces.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class AdminUserController {
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Page<UserDto>> getAllUsers(
            @PageableDefault(size = 20, sort = "username") Pageable pageable) {
        Page<User> users = userRepository.findAll(pageable);
        Page<UserDto> userDtos = users.map(user -> UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .build());
        return ResponseEntity.ok(userDtos);
    }

    @PutMapping("/{userId}/role")
    public ResponseEntity<UserDto> updateUserRole(
            @PathVariable String userId,
            @RequestParam UserRole role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setRole(role);
        User savedUser = userRepository.save(user);

        UserDto userDto = UserDto.builder()
                .id(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .build();

        return ResponseEntity.ok(userDto);
    }
}