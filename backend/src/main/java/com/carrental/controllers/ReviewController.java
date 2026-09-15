package com.carrental.controllers;

import com.carrental.dto.ReviewRequest;
import com.carrental.dto.ReviewResponse;
import com.carrental.services.ReviewService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/reviews")
    public ResponseEntity<ReviewResponse> create(@Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.create(request));
    }

    @GetMapping("/reviews/car/{carId}")
    public ResponseEntity<List<ReviewResponse>> byCar(@PathVariable Long carId) {
        return ResponseEntity.ok(reviewService.getByCar(carId));
    }
}