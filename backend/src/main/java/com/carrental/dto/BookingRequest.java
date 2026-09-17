package com.carrental.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record BookingRequest(
        @NotNull Long carId,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        boolean withDriver,
        @Size(max = 500) String pickupLocation
) {
}