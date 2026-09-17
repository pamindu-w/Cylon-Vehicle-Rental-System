package com.carrental.services;

import com.carrental.dto.ReviewRequest;
import com.carrental.dto.ReviewResponse;
import com.carrental.entities.Booking;
import com.carrental.entities.Review;
import com.carrental.entities.User;
import com.carrental.entities.enums.BookingStatus;
import com.carrental.repositories.BookingRepository;
import com.carrental.repositories.ReviewRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;

    public ReviewService(ReviewRepository reviewRepository, BookingRepository bookingRepository) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
    }

    @Transactional
    public ReviewResponse create(@Valid ReviewRequest request, User customer) {
        Booking booking = bookingRepository.findById(request.bookingId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        if (booking.getUser() == null || !booking.getUser().getId().equals(customer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only review your own bookings");
        }
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Reviews can only be left for completed bookings");
        }
        if (reviewRepository.existsByBookingId(booking.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A review already exists for this booking");
        }

        Review review = Review.builder()
                .booking(booking)
                .car(booking.getCar())
                .reviewerName(booking.getGuestName())
                .rating(request.rating())
                .comment(request.comment())
                .build();

        return ReviewResponse.from(reviewRepository.save(review));
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getByCar(Long carId) {
        return reviewRepository.findByCarIdOrderByCreatedAtDesc(carId).stream()
                .map(ReviewResponse::from)
                .toList();
    }
}