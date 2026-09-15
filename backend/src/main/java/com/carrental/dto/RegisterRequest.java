package com.carrental.dto;

import com.carrental.entities.enums.AccountType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank String fullName,
        String businessName,
        @NotBlank String phone,
        @NotNull AccountType accountType,

        @Pattern(regexp = "^[0-9]{9,12}[VvXx]?$",
                message = "NIC must be a valid Sri Lankan NIC (9 digits + V/X, or 12 digits)")
        @Size(max = 20)
        String nic,

        @Size(max = 50)
        String passportNo,

        @Size(max = 100)
        String nationality
) {
}