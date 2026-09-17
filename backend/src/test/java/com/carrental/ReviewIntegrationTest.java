package com.carrental;

import com.carrental.entities.Booking;
import com.carrental.entities.enums.BookingStatus;
import com.carrental.repositories.BookingRepository;
import com.carrental.support.IntegrationTestBase;
import java.time.LocalDate;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class ReviewIntegrationTest extends IntegrationTestBase {

    @Autowired
    private BookingRepository bookingRepository;

    private final String guestEmail = "reviewer-" + System.nanoTime() + "@test.com";

    private void completeBooking(long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow();
        booking.setStartDate(LocalDate.now().minusDays(10));
        booking.setEndDate(LocalDate.now().minusDays(5));
        booking.setStatus(BookingStatus.COMPLETED);
        bookingRepository.save(booking);
    }

    private void reviewBooking(String token, long bookingId, int rating) throws Exception {
        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("bookingId", bookingId, "rating", rating,
                                "comment", "Great car!"))))
                .andReturn();
    }

    @Test
    void reviewForCompletedBooking() throws Exception {
        String customerToken = registerCustomerAndGetToken(guestEmail);
        String ownerToken = registerOwnerAndGetToken("rev-own-" + System.nanoTime() + "@test.com");
        long carId = createCar(ownerToken, "Toyota", "Prius");
        long bookingId = createBooking(customerToken, carId,
                LocalDate.now().plusDays(10).toString(),
                LocalDate.now().plusDays(12).toString());
        completeBooking(bookingId);

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("bookingId", bookingId, "rating", 5,
                                "comment", "Great car!"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rating").value(5));

        mockMvc.perform(get("/api/reviews/car/" + carId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void duplicateReviewRejected() throws Exception {
        String customerToken = registerCustomerAndGetToken(guestEmail);
        String ownerToken = registerOwnerAndGetToken("dup-rev-" + System.nanoTime() + "@test.com");
        long carId = createCar(ownerToken, "Honda", "Civic");
        long bookingId = createBooking(customerToken, carId,
                LocalDate.now().plusDays(10).toString(),
                LocalDate.now().plusDays(12).toString());
        completeBooking(bookingId);
        reviewBooking(customerToken, bookingId, 4);

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("bookingId", bookingId, "rating", 3))))
                .andExpect(status().isConflict());
    }

    @Test
    void reviewForPendingBookingRejected() throws Exception {
        String customerToken = registerCustomerAndGetToken(guestEmail);
        String ownerToken = registerOwnerAndGetToken("pending-rev-" + System.nanoTime() + "@test.com");
        long carId = createCar(ownerToken, "Suzuki", "Alto");
        long bookingId = createBooking(customerToken, carId,
                LocalDate.now().plusDays(20).toString(),
                LocalDate.now().plusDays(22).toString());
        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("bookingId", bookingId, "rating", 5))))
                .andExpect(status().isConflict());
    }

    @Test
    void otherCustomerCannotReview() throws Exception {
        String customerToken = registerCustomerAndGetToken(guestEmail);
        String otherToken = registerCustomerAndGetToken("other-rev-" + System.nanoTime() + "@test.com");
        String ownerToken = registerOwnerAndGetToken("other-owner-" + System.nanoTime() + "@test.com");
        long carId = createCar(ownerToken, "Nissan", "Sunny");
        long bookingId = createBooking(customerToken, carId,
                LocalDate.now().plusDays(10).toString(),
                LocalDate.now().plusDays(12).toString());
        completeBooking(bookingId);
        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("bookingId", bookingId, "rating", 5))))
                .andExpect(status().isForbidden());
    }
}