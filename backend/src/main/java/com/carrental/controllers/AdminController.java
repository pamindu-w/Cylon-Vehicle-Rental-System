package com.carrental.controllers;

import com.carrental.dto.AdminReviewResponse;
import com.carrental.dto.AdminStatsResponse;
import com.carrental.dto.BookingResponse;
import com.carrental.dto.CarListResponse;
import com.carrental.dto.CarResponse;
import com.carrental.dto.MessageResponse;
import com.carrental.dto.UserResponse;
import com.carrental.entities.enums.BookingStatus;
import com.carrental.entities.enums.CarStatus;
import com.carrental.services.AdminService;
import com.carrental.services.CurrentUserResolver;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final CurrentUserResolver currentUserResolver;

    public AdminController(AdminService adminService, CurrentUserResolver currentUserResolver) {
        this.adminService = adminService;
        this.currentUserResolver = currentUserResolver;
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> listUsers() {
        return ResponseEntity.ok(adminService.listUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUser(id));
    }

    @PatchMapping("/users/{id}/enabled")
    public ResponseEntity<UserResponse> setUserEnabled(@PathVariable Long id,
                                                       @RequestParam boolean enabled) {
        return ResponseEntity.ok(adminService.setUserEnabled(id, enabled, currentUserResolver.get().getId()));
    }

    @GetMapping("/cars")
    public ResponseEntity<List<CarListResponse>> listCars() {
        return ResponseEntity.ok(adminService.listAllCars());
    }

    @PatchMapping("/cars/{id}/status")
    public ResponseEntity<CarResponse> setCarStatus(@PathVariable Long id,
                                                    @RequestParam CarStatus status) {
        return ResponseEntity.ok(adminService.setCarStatus(id, status));
    }

    @DeleteMapping("/cars/{id}")
    public ResponseEntity<MessageResponse> deleteCar(@PathVariable Long id) {
        adminService.deleteCar(id);
        return ResponseEntity.ok(new MessageResponse("Car deleted"));
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponse>> listBookings() {
        return ResponseEntity.ok(adminService.listAllBookings());
    }

    @PatchMapping("/bookings/{id}/status")
    public ResponseEntity<BookingResponse> setBookingStatus(@PathVariable Long id,
                                                            @RequestParam BookingStatus status) {
        return ResponseEntity.ok(adminService.setBookingStatus(id, status));
    }

    @GetMapping("/reviews")
    public ResponseEntity<List<AdminReviewResponse>> listReviews() {
        return ResponseEntity.ok(adminService.listAllReviews());
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<MessageResponse> deleteReview(@PathVariable Long id) {
        adminService.deleteReview(id);
        return ResponseEntity.ok(new MessageResponse("Review deleted"));
    }
}