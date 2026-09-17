package com.carrental;

import com.carrental.entities.Booking;
import com.carrental.entities.enums.BookingStatus;
import com.carrental.repositories.BookingRepository;
import com.carrental.repositories.CarRepository;
import com.carrental.repositories.ReviewRepository;
import com.carrental.services.BookingService;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class BookingSchedulerTest {

    private final BookingRepository bookingRepository = mock(BookingRepository.class);
    private final BookingService bookingService = new BookingService(
            bookingRepository,
            mock(CarRepository.class),
            mock(ReviewRepository.class),
            24);

    @Test
    void confirmedBookingWithPastStartDateBecomesActive() {
        Booking booking = newBooking(LocalDate.now().minusDays(1), BookingStatus.CONFIRMED);
        when(bookingRepository.findByStatusAndStartDateLessThanEqual(
                BookingStatus.CONFIRMED, LocalDate.now())).thenReturn(List.of(booking));

        bookingService.processScheduledTransitions();

        assertEquals(BookingStatus.ACTIVE, booking.getStatus());
    }

    @Test
    void stalePendingBookingIsCancelled() {
        Booking booking = newBooking(LocalDate.now().minusDays(1), BookingStatus.PENDING);
        when(bookingRepository.findByStatusAndStartDateBefore(
                BookingStatus.PENDING, LocalDate.now())).thenReturn(List.of(booking));

        bookingService.processScheduledTransitions();

        assertEquals(BookingStatus.CANCELLED, booking.getStatus());
    }

    @Test
    void expiredActiveBookingIsCompleted() {
        Booking booking = newBooking(LocalDate.now().minusDays(2), BookingStatus.ACTIVE);
        when(bookingRepository.findByStatusInAndEndDateBefore(any(), any())).thenReturn(List.of(booking));

        bookingService.processScheduledTransitions();

        assertEquals(BookingStatus.COMPLETED, booking.getStatus());
    }

    @Test
    void confirmedBookingStartingTomorrowIsNotActivated() {
        Booking booking = newBooking(LocalDate.now().plusDays(1), BookingStatus.CONFIRMED);

        bookingService.processScheduledTransitions();

        assertEquals(BookingStatus.CONFIRMED, booking.getStatus());
    }

    private Booking newBooking(LocalDate startDate, BookingStatus status) {
        return Booking.builder()
                .startDate(startDate)
                .endDate(startDate.plusDays(1))
                .status(status)
                .build();
    }
}