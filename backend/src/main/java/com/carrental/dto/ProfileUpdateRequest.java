package com.carrental.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
        @NotBlank @Size(max = 255) String fullName,
        @Size(max = 255) String businessName,
        @NotBlank @Size(max = 50) String phone
) {
}