package com.hust.hustforces.model.dto.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardUserDto {
    private String id;
    private String username;
    private String email;
    private String role;
    private String createdAt;
}
