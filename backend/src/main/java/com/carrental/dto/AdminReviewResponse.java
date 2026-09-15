package com.carrental.dto;

import com.carrental.entities.Review;
import java.time.Instant;

public record AdminReviewResponse(
        Long id,
        Long bookingId,
        Long carId,
        String carMake,
        String carModel,
        String reviewerName,
        Integer rating,
        String comment,
        Instant createdAt
) {
    public static AdminReviewResponse from(Review review) {
        return new AdminReviewResponse(
                review.getId(),
                review.getBooking().getId(),
                review.getCar().getId(),
                review.getCar().getMake(),
                review.getCar().getModel(),
                review.getReviewerName(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}