package com.hust.hustforces.model.dto;

import com.hust.hustforces.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {
    private String id;
    private String username;
    private String email;
    private String profilePicture;
    private UserRole role;
}
