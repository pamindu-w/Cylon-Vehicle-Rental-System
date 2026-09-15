package com.carrental.dto;

import com.carrental.entities.enums.CarStatus;
import com.carrental.entities.enums.CarType;
import com.carrental.entities.enums.FuelType;
import com.carrental.entities.enums.Transmission;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CarRequest(
        @NotBlank String make,
        @NotBlank String model,
        @NotNull @Min(1950) @Max(2100) Integer year,
        @NotNull CarType type,
        @NotNull Transmission transmission,
        @NotNull @Min(1) Integer seats,
        @NotNull FuelType fuel,
        @NotNull @DecimalMin("0.0") BigDecimal dailyPrice,
        boolean withDriver,
        @DecimalMin("0.0") BigDecimal driverDailyPrice,
        @NotBlank String city,
        Double lat,
        Double lng,
        String description,
        CarStatus status
) {
}