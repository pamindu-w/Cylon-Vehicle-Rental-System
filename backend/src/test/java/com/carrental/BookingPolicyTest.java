package com.carrental;

import com.carrental.entities.enums.BookingStatus;
import com.carrental.services.BookingPolicy;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class BookingPolicyTest {

    @Test
    void pendingBookingsAlwaysCancellable() {
        assertTrue(BookingPolicy.canCancel(BookingStatus.PENDING,
                LocalDateTime.now(), LocalDate.now().plusDays(1), 24));
    }

    @Test
    void cancelledBookingsNotCancellable() {
        assertFalse(BookingPolicy.canCancel(BookingStatus.CANCELLED,
                LocalDateTime.now(), LocalDate.now().plusDays(10), 24));
    }

    @Test
    void completedBookingsNotCancellable() {
        assertFalse(BookingPolicy.canCancel(BookingStatus.COMPLETED,
                LocalDateTime.now(), LocalDate.now().plusDays(10), 24));
    }

    @Test
    void activeBookingsNotCancellable() {
        assertFalse(BookingPolicy.canCancel(BookingStatus.ACTIVE,
                LocalDateTime.now(), LocalDate.now().plusDays(10), 24));
    }

    @Test
    void confirmedBookingsCancellableBeforeDeadline() {
        LocalDateTime now = LocalDateTime.of(2026, 1, 10, 12, 0);
        LocalDate startDate = LocalDate.of(2026, 1, 20);
        assertTrue(BookingPolicy.canCancel(BookingStatus.CONFIRMED, now, startDate, 24));
    }

    @Test
    void confirmedBookingsNotCancellableAfterDeadline() {
        LocalDateTime now = LocalDateTime.of(2026, 1, 19, 12, 0);
        LocalDate startDate = LocalDate.of(2026, 1, 20);
        assertFalse(BookingPolicy.canCancel(BookingStatus.CONFIRMED, now, startDate, 24));
    }

    @Test
    void cancelDeadlineComputedCorrectly() {
        LocalDate start = LocalDate.of(2026, 6, 15);
        assertEquals(LocalDateTime.of(2026, 6, 14, 0, 0), BookingPolicy.cancelDeadline(start, 24));
        assertEquals(LocalDateTime.of(2026, 6, 13, 12, 0), BookingPolicy.cancelDeadline(start, 36));
    }
}
