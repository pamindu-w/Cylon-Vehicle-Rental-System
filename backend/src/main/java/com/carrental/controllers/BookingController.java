package com.carrental.controllers;

import com.carrental.dto.BookingRequest;
import com.carrental.dto.BookingResponse;
import com.carrental.entities.enums.BookingStatus;
import com.carrental.services.BookingService;
import com.carrental.services.CurrentUserResolver;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final CurrentUserResolver currentUserResolver;

    public BookingController(BookingService bookingService, CurrentUserResolver currentUserResolver) {
        this.bookingService = bookingService;
        this.currentUserResolver = currentUserResolver;
    }

    @PostMapping
    public ResponseEntity<BookingResponse> create(@Valid @RequestBody BookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.create(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<BookingResponse>> myBookings() {
        return ResponseEntity.ok(bookingService.getMyBookings(currentUserResolver.get()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<BookingResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getForOwner(id, currentUserResolver.get()));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<BookingResponse> setStatus(@PathVariable Long id,
                                                     @RequestParam BookingStatus status) {
        return ResponseEntity.ok(bookingService.setStatus(id, status, currentUserResolver.get()));
    }
}