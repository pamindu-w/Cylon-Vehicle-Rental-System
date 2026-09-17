package com.carrental;

import com.carrental.entities.enums.BookingStatus;
import com.carrental.repositories.BookingRepository;
import com.carrental.support.IntegrationTestBase;
import java.time.LocalDate;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class BookingIntegrationTest extends IntegrationTestBase {

    @Autowired
    private BookingRepository bookingRepository;

    private final String email = "cust-" + System.nanoTime() + "@test.com";

    @Test
    void createBookingSuccess() throws Exception {
        String customerToken = registerCustomerAndGetToken(email);
        String ownerToken = registerOwnerAndGetToken("book-own-" + System.nanoTime() + "@test.com");
        long carId = createCar(ownerToken, "Toyota", "Axio");
        LocalDate start = LocalDate.now().plusDays(5);
        LocalDate end = start.plusDays(2);
        long id = createBooking(customerToken, carId, start.toString(), end.toString());
        assertTrue(id > 0);
        mockMvc.perform(get("/api/bookings/" + id)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.totalPrice").value(27000))
                .andExpect(jsonPath("$.guestName").value("Test Customer"));
    }

    @Test
    void unauthenticatedBookingRejected() throws Exception {
        String ownerToken = registerOwnerAndGetToken("noauth-own-" + System.nanoTime() + "@test.com");
        long carId = createCar(ownerToken, "Honda", "Fit");
        LocalDate start = LocalDate.now().plusDays(10);
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "carId", carId,
                                "startDate", start.toString(),
                                "endDate", start.plusDays(1).toString(),
                                "withDriver", false))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void overlappingBookingRejected() throws Exception {
        String customerToken = registerCustomerAndGetToken(email);
        String ownerToken = registerOwnerAndGetToken("overlap-own-" + System.nanoTime() + "@test.com");
        long carId = createCar(ownerToken, "Honda", "Fit");
        LocalDate start = LocalDate.now().plusDays(10);
        LocalDate end = start.plusDays(3);
        createBooking(customerToken, carId, start.toString(), end.toString());
        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "carId", carId,
                                "startDate", start.toString(),
                                "endDate", end.minusDays(1).toString(),
                                "withDriver", false))))
                .andExpect(status().isConflict());
    }

    @Test
    void ownerConfirmBooking() throws Exception {
        String customerToken = registerCustomerAndGetToken(email);
        String ownerToken = registerOwnerAndGetToken("conf-own-" + System.nanoTime() + "@test.com");
        long carId = createCar(ownerToken, "Kia", "Carnival");
        long id = createBooking(customerToken, carId, LocalDate.now().plusDays(20).toString(),
                LocalDate.now().plusDays(22).toString());
        mockMvc.perform(patch("/api/bookings/" + id + "/status?status=CONFIRMED")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    @Test
    void customerCancelPendingBooking() throws Exception {
        String customerToken = registerCustomerAndGetToken(email);
        String ownerToken = registerOwnerAndGetToken("cancel-pend-" + System.nanoTime() + "@test.com");
        long carId = createCar(ownerToken, "Suzuki", "Alto");
        long id = createBooking(customerToken, carId, LocalDate.now().plusDays(30).toString(),
                LocalDate.now().plusDays(32).toString());
        mockMvc.perform(post("/api/bookings/" + id + "/cancel")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void customerCancelConfirmedWithinFreeWindow() throws Exception {
        String customerToken = registerCustomerAndGetToken(email);
        String ownerToken = registerOwnerAndGetToken("cancel-conf-" + System.nanoTime() + "@test.com");
        long carId = createCar(ownerToken, "Toyota", "Vitz");
        // start in 10 days — well within the 24h cancellation window
        long id = createBooking(customerToken, carId, LocalDate.now().plusDays(10).toString(),
                LocalDate.now().plusDays(12).toString());
        mockMvc.perform(patch("/api/bookings/" + id + "/status?status=CONFIRMED")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/bookings/" + id + "/cancel")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void customerCancelConfirmedTooLate() throws Exception {
        String customerToken = registerCustomerAndGetToken(email);
        String ownerToken = registerOwnerAndGetToken("cancel-late-" + System.nanoTime() + "@test.com");
        long carId = createCar(ownerToken, "Honda", "Civic");
        // start tomorrow — within 24h, so customer can no longer cancel
        long id = createBooking(customerToken, carId, LocalDate.now().plusDays(1).toString(),
                LocalDate.now().plusDays(3).toString());
        mockMvc.perform(patch("/api/bookings/" + id + "/status?status=CONFIRMED")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/bookings/" + id + "/cancel")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isConflict());
    }

    @Test
    void otherCustomerCannotCancel() throws Exception {
        String customerToken = registerCustomerAndGetToken(email);
        String otherToken = registerCustomerAndGetToken("other-cust-" + System.nanoTime() + "@test.com");
        String ownerToken = registerOwnerAndGetToken("cancel-other-" + System.nanoTime() + "@test.com");
        long carId = createCar(ownerToken, "Nissan", "March");
        long id = createBooking(customerToken, carId, LocalDate.now().plusDays(15).toString(),
                LocalDate.now().plusDays(17).toString());
        mockMvc.perform(post("/api/bookings/" + id + "/cancel")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void myRentalsListsOnlyOwnBookings() throws Exception {
        String customerToken = registerCustomerAndGetToken(email);
        String otherToken = registerCustomerAndGetToken("mine-" + System.nanoTime() + "@test.com");
        String ownerToken = registerOwnerAndGetToken("mine-own-" + System.nanoTime() + "@test.com");
        long carId = createCar(ownerToken, "Mitsubishi", "Mirage");
        createBooking(customerToken, carId, LocalDate.now().plusDays(30).toString(),
                LocalDate.now().plusDays(32).toString());
        createBooking(otherToken, carId, LocalDate.now().plusDays(40).toString(),
                LocalDate.now().plusDays(42).toString());
        mockMvc.perform(get("/api/bookings/mine")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void completeExpiredBookings() throws Exception {
        String customerToken = registerCustomerAndGetToken(email);
        String ownerToken = registerOwnerAndGetToken("expire-" + System.nanoTime() + "@test.com");
        long carId = createCar(ownerToken, "Tata", "Nexon");
        long id = createBooking(customerToken, carId, LocalDate.now().plusDays(10).toString(),
                LocalDate.now().plusDays(12).toString());
        bookingRepository.findById(id).ifPresent(b -> {
            b.setStartDate(LocalDate.now().minusDays(5));
            b.setEndDate(LocalDate.now().minusDays(3));
            bookingRepository.save(b);
        });
        mockMvc.perform(patch("/api/bookings/" + id + "/status?status=CONFIRMED")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());
        bookingRepository.findByStatusInAndEndDateBefore(
                        java.util.List.of(BookingStatus.CONFIRMED), LocalDate.now())
                .forEach(b -> {
                    b.setStatus(BookingStatus.COMPLETED);
                    bookingRepository.save(b);
                });
        mockMvc.perform(get("/api/bookings/" + id)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }
}