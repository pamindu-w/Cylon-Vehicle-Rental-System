package com.carrental.dto;

import com.carrental.entities.Booking;
import com.carrental.entities.enums.BookingStatus;
import com.carrental.entities.enums.IdType;
import com.carrental.entities.enums.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record BookingResponse(
        Long id,
        Long carId,
        String carMake,
        String carModel,
        String guestName,
        String guestEmail,
        String guestPhone,
        IdType guestIdType,
        String guestIdNumber,
        LocalDate startDate,
        LocalDate endDate,
        boolean withDriver,
        String pickupLocation,
        BigDecimal totalPrice,
        BookingStatus status,
        PaymentStatus paymentStatus,
        Instant createdAt,
        boolean hasReview
) {
    public static BookingResponse from(Booking booking) {
        return from(booking, false);
    }

    public static BookingResponse from(Booking booking, boolean hasReview) {
        return new BookingResponse(
                booking.getId(),
                booking.getCar().getId(),
                booking.getCar().getMake(),
                booking.getCar().getModel(),
                booking.getGuestName(),
                booking.getGuestEmail(),
                booking.getGuestPhone(),
                booking.getGuestIdType(),
                booking.getGuestIdNumber(),
                booking.getStartDate(),
                booking.getEndDate(),
                booking.isWithDriver(),
                booking.getPickupLocation(),
                booking.getTotalPrice(),
                booking.getStatus(),
                booking.getPaymentStatus(),
                booking.getCreatedAt(),
                hasReview
        );
    }
}