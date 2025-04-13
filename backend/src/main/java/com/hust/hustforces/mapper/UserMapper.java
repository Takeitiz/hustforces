package com.hust.hustforces.mapper;

import com.hust.hustforces.model.dto.UserDto;
import com.hust.hustforces.model.dto.discussion.UserSummaryDto;
import com.hust.hustforces.model.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "profilePicture", ignore = true)
    UserDto toUserDto(User user);

    @Mapping(target = "profilePicture", ignore = true)
    UserSummaryDto toUserSummaryDto(User user);
}
