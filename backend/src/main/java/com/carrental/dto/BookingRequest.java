package com.carrental.dto;

import com.carrental.entities.enums.IdType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record BookingRequest(
        @NotNull Long carId,
        @NotBlank @Size(max = 255) String guestName,
        @NotBlank @Email @Size(max = 255) String guestEmail,
        @NotBlank @Size(max = 50) String guestPhone,
        @NotNull IdType guestIdType,
        @NotBlank @Size(max = 50) String guestIdNumber,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        boolean withDriver,
        @Size(max = 500) String pickupLocation
) {
}