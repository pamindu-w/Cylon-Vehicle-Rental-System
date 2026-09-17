package com.carrental.controllers;

import com.carrental.entities.CarImage;
import com.carrental.repositories.CarImageRepository;
import java.time.Duration;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/images")
public class ImageController {

    private final CarImageRepository carImageRepository;

    public ImageController(CarImageRepository carImageRepository) {
        this.carImageRepository = carImageRepository;
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> get(@PathVariable Long id) {
        CarImage image = carImageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found"));
        String contentType = image.getContentType() == null
                ? MediaType.APPLICATION_OCTET_STREAM_VALUE
                : image.getContentType();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
                .body(image.getData());
    }
}