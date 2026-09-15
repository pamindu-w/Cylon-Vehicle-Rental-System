package com.carrental.dto;

import java.math.BigDecimal;

public record AdminStatsResponse(
        long totalUsers,
        long totalOwners,
        long totalCars,
        long activeCars,
        long hiddenCars,
        long totalBookings,
        long pendingBookings,
        long confirmedBookings,
        long completedBookings,
        long cancelledBookings,
        BigDecimal totalRevenue
) {
}