package com.carrental.dto;

import com.carrental.entities.User;
import com.carrental.entities.enums.AccountType;
import com.carrental.entities.enums.Role;

public record UserResponse(
        Long id,
        String email,
        String fullName,
        String businessName,
        String phone,
        Role role,
        AccountType accountType,
        String nic,
        String passportNo,
        String nationality,
        String avatarUrl,
        boolean enabled
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getBusinessName(),
                user.getPhone(),
                user.getRole(),
                user.getAccountType(),
                user.getNic(),
                user.getPassportNo(),
                user.getNationality(),
                user.getAvatarUrl(),
                user.isEnabled()
        );
    }
}