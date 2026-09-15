package com.carrental.dto;

import com.carrental.entities.User;
import com.carrental.entities.enums.Role;

public record AuthResponse(
        String token,
        String tokenType,
        UserResponse user
) {
    public static AuthResponse from(String token, User user) {
        return new AuthResponse(token, "Bearer", UserResponse.from(user));
    }
}