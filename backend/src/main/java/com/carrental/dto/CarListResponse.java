package com.carrental.dto;

import com.carrental.entities.enums.CarStatus;
import com.carrental.entities.enums.CarType;
import com.carrental.entities.enums.FuelType;
import com.carrental.entities.enums.Transmission;
import java.math.BigDecimal;
import java.util.List;

public record CarListResponse(
        Long id,
        Long ownerId,
        String ownerName,
        String make,
        String model,
        Integer year,
        CarType type,
        Transmission transmission,
        Integer seats,
        FuelType fuel,
        BigDecimal dailyPrice,
        boolean withDriver,
        BigDecimal driverDailyPrice,
        String city,
        Double lat,
        Double lng,
        CarStatus status,
        List<String> imageUrls,
        Double averageRating,
        Long ratingCount,
        Long viewCount
) {
}