package com.hust.hustforces.model.dto.standings;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserBadgeDto {
    private String id;
    private String name;
    private String icon;
    private String color;
    private String description;
}
