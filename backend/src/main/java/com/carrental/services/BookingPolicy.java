package com.carrental.services;

import com.carrental.entities.enums.BookingStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;

public final class BookingPolicy {

    private BookingPolicy() {
    }

    public static LocalDateTime cancelDeadline(LocalDate startDate, int freeHours) {
        return startDate.atStartOfDay().minusHours(freeHours);
    }

    public static boolean canCancel(BookingStatus status, LocalDateTime now,
                                    LocalDate startDate, int freeHours) {
        if (status == BookingStatus.PENDING) {
            return true;
        }
        if (status != BookingStatus.CONFIRMED) {
            return false;
        }
        return now.isBefore(cancelDeadline(startDate, freeHours));
    }
}