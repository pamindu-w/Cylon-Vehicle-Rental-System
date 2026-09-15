package com.carrental.config;

import com.carrental.services.BookingService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class BookingScheduler {

    private final BookingService bookingService;

    public BookingScheduler(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @Scheduled(cron = "0 0 2 * * *")
    public void completeExpiredBookings() {
        bookingService.completeExpiredBookings();
    }
}