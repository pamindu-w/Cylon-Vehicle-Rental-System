package com.carrental.controllers;

import com.carrental.dto.CarListResponse;
import com.carrental.dto.CarRequest;
import com.carrental.dto.CarResponse;
import com.carrental.dto.MessageResponse;
import com.carrental.dto.UploadResponse;
import com.carrental.entities.enums.CarStatus;
import com.carrental.entities.enums.CarType;
import com.carrental.entities.enums.Transmission;
import com.carrental.services.CarService;
import com.carrental.services.CurrentUserResolver;
import com.carrental.services.UploadService;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/cars")
public class CarController {

    private final CarService carService;
    private final CurrentUserResolver currentUserResolver;
    private final UploadService uploadService;

    public CarController(CarService carService,
                         CurrentUserResolver currentUserResolver,
                         UploadService uploadService) {
        this.carService = carService;
        this.currentUserResolver = currentUserResolver;
        this.uploadService = uploadService;
    }

    @GetMapping
    public ResponseEntity<List<CarListResponse>> search(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) CarType type,
            @RequestParam(required = false) Integer seats,
            @RequestParam(required = false) Transmission transmission,
            @RequestParam(required = false) Boolean withDriver) {
        return ResponseEntity.ok(carService.search(city, minPrice, maxPrice, type, seats, transmission, withDriver));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CarResponse> getPublic(@PathVariable Long id) {
        return ResponseEntity.ok(carService.getPublicCar(id));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<CarListResponse>> mine() {
        return ResponseEntity.ok(carService.getMyCars(currentUserResolver.get()));
    }

    @GetMapping("/{id}/owner")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<CarResponse> getForOwner(@PathVariable Long id) {
        return ResponseEntity.ok(carService.getCarForOwner(id, currentUserResolver.get()));
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<CarResponse> create(@Valid @RequestBody CarRequest request) {
        return ResponseEntity.ok(carService.createCar(request, currentUserResolver.get()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<CarResponse> update(@PathVariable Long id,
                                              @Valid @RequestBody CarRequest request) {
        return ResponseEntity.ok(carService.updateCar(id, request, currentUserResolver.get()));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<CarResponse> setStatus(@PathVariable Long id,
                                                 @RequestParam CarStatus status) {
        return ResponseEntity.ok(carService.setStatus(id, status, currentUserResolver.get()));
    }

    @PostMapping(value = "/{id}/images", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<CarResponse> uploadImages(@PathVariable Long id,
                                                    @RequestParam("files") List<MultipartFile> files) {
        List<String> urls = files.stream()
                .map(uploadService::store)
                .map(UploadResponse::url)
                .toList();
        return ResponseEntity.ok(carService.addImages(id, urls, currentUserResolver.get()));
    }

    @DeleteMapping("/{id}/images/{imageId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<MessageResponse> deleteImage(@PathVariable Long id,
                                                       @PathVariable Long imageId) {
        carService.deleteImage(id, imageId, currentUserResolver.get());
        return ResponseEntity.ok(new MessageResponse("Image deleted"));
    }
}