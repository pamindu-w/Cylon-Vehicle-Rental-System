package com.carrental.dto;

import com.carrental.entities.Review;
import java.time.Instant;

public record ReviewResponse(
        Long id,
        Long bookingId,
        Long carId,
        String reviewerName,
        Integer rating,
        String comment,
        Instant createdAt
) {
    public static ReviewResponse from(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getBooking().getId(),
                review.getCar().getId(),
                review.getReviewerName(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}