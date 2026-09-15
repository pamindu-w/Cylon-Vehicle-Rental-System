package com.carrental.dto;

import com.carrental.entities.Car;
import com.carrental.entities.CarImage;
import com.carrental.entities.enums.CarStatus;
import com.carrental.entities.enums.CarType;
import com.carrental.entities.enums.FuelType;
import com.carrental.entities.enums.Transmission;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

public record CarResponse(
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
        String description,
        CarStatus status,
        List<String> imageUrls,
        List<Long> imageIds,
        Double averageRating,
        Long ratingCount
) {
    public static CarResponse from(Car car) {
        List<CarImage> images = car.getImages() == null
                ? List.of()
                : car.getImages().stream()
                        .sorted(Comparator.comparing(CarImage::getSort))
                        .toList();
        List<String> imageUrls = images.stream().map(CarImage::getUrl).toList();
        List<Long> imageIds = images.stream().map(CarImage::getId).toList();
        return new CarResponse(
                car.getId(),
                car.getOwner().getId(),
                car.getOwner().getFullName(),
                car.getMake(),
                car.getModel(),
                car.getYear(),
                car.getType(),
                car.getTransmission(),
                car.getSeats(),
                car.getFuel(),
                car.getDailyPrice(),
                car.isWithDriver(),
                car.getDriverDailyPrice(),
                car.getCity(),
                car.getLat(),
                car.getLng(),
                car.getDescription(),
                car.getStatus(),
                imageUrls,
                imageIds,
                null,
                null
        );
    }
}