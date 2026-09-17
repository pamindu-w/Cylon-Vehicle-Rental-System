package com.carrental.services;

import com.carrental.dto.CarListResponse;
import com.carrental.dto.CarRequest;
import com.carrental.dto.CarResponse;
import com.carrental.entities.Car;
import com.carrental.entities.CarImage;
import com.carrental.entities.User;
import com.carrental.entities.enums.CarStatus;
import com.carrental.entities.enums.CarType;
import com.carrental.entities.enums.FuelType;
import com.carrental.entities.enums.Transmission;
import com.carrental.repositories.CarRepository;
import com.carrental.repositories.ReviewRepository;
import com.carrental.repositories.BookingRepository;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CarService {

    private final CarRepository carRepository;
    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;

    public CarService(CarRepository carRepository, ReviewRepository reviewRepository,
                      BookingRepository bookingRepository) {
        this.carRepository = carRepository;
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
    }

    @Transactional(readOnly = true)
    public List<CarListResponse> search(String city, BigDecimal minPrice, BigDecimal maxPrice,
                                        CarType type, Integer seats, Transmission transmission,
                                        Boolean withDriver) {
        Specification<Car> spec = Specification.where(eqStatus(CarStatus.ACTIVE));

        if (city != null && !city.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(cb.lower(root.get("city")), city.trim().toLowerCase()));
        }
        if (type != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("type"), type));
        }
        if (seats != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("seats"), seats));
        }
        if (transmission != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("transmission"), transmission));
        }
        if (withDriver != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("withDriver"), withDriver));
        }
        if (minPrice != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("dailyPrice"), minPrice));
        }
        if (maxPrice != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("dailyPrice"), maxPrice));
        }

        return carRepository.findAll(spec).stream()
                .map(this::toListResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CarResponse getPublicCar(Long id) {
        Car car = carRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found"));
        if (car.getStatus() != CarStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found");
        }
        return toResponse(car);
    }

    @Transactional
    public void recordView(Long id) {
        carRepository.findById(id)
                .filter(car -> car.getStatus() == CarStatus.ACTIVE)
                .ifPresent(car -> carRepository.incrementViewCount(id));
    }

    @Transactional(readOnly = true)
    public CarResponse getCarForOwner(Long carId, User owner) {
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found"));
        if (!car.getOwner().getId().equals(owner.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this car");
        }
        return toResponse(car);
    }

    @Transactional(readOnly = true)
    public List<CarListResponse> getMyCars(User owner) {
        return carRepository.findByOwnerId(owner.getId()).stream()
                .map(this::toListResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CarListResponse> getAllCars() {
        return carRepository.findAll().stream()
                .map(this::toListResponse)
                .toList();
    }

    @Transactional
    public CarResponse adminSetStatus(Long carId, CarStatus status) {
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found"));
        car.setStatus(status);
        return toResponse(carRepository.save(car));
    }

    @Transactional
    public void adminDeleteCar(Long carId) {
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found"));
        if (bookingRepository.countByCarId(carId) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot delete a car with booking history; hide it instead");
        }
        carRepository.delete(car);
    }

    @Transactional
    public CarResponse createCar(CarRequest request, User owner, List<MultipartFile> files) {
        Car car = Car.builder()
                .owner(owner)
                .make(request.make().trim())
                .model(request.model().trim())
                .year(request.year())
                .type(request.type())
                .transmission(request.transmission())
                .seats(request.seats())
                .fuel(request.fuel())
                .dailyPrice(request.dailyPrice())
                .withDriver(request.withDriver())
                .driverDailyPrice(request.withDriver() ? request.driverDailyPrice() : null)
                .city(request.city().trim())
                .lat(request.lat())
                .lng(request.lng())
                .description(request.description())
                .status(request.status() == null ? CarStatus.DRAFT : request.status())
                .build();
        attachImages(car, files);
        Car saved = carRepository.save(car);
        return toResponse(saved);
    }

    @Transactional
    public CarResponse updateCar(Long carId, CarRequest request, User owner) {
        Car car = getOwnedCar(carId, owner);
        car.setMake(request.make().trim());
        car.setModel(request.model().trim());
        car.setYear(request.year());
        car.setType(request.type());
        car.setTransmission(request.transmission());
        car.setSeats(request.seats());
        car.setFuel(request.fuel());
        car.setDailyPrice(request.dailyPrice());
        car.setWithDriver(request.withDriver());
        car.setDriverDailyPrice(request.withDriver() ? request.driverDailyPrice() : null);
        car.setCity(request.city().trim());
        car.setLat(request.lat());
        car.setLng(request.lng());
        car.setDescription(request.description());
        if (request.status() != null) {
            car.setStatus(request.status());
        }
        return toResponse(carRepository.save(car));
    }

    @Transactional
    public CarResponse setStatus(Long carId, CarStatus status, User owner) {
        Car car = getOwnedCar(carId, owner);
        car.setStatus(status);
        return toResponse(carRepository.save(car));
    }

    @Transactional
    public CarResponse addImages(Long carId, List<MultipartFile> files, User owner) {
        Car car = getOwnedCar(carId, owner);
        attachImages(car, files);
        return toResponse(carRepository.save(car));
    }

    @Transactional
    public void deleteImage(Long carId, Long imageId, User owner) {
        Car car = getOwnedCar(carId, owner);
        boolean removed = car.getImages().removeIf(img -> img.getId().equals(imageId));
        if (!removed) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found");
        }
        carRepository.save(car);
    }

    private void attachImages(Car car, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return;
        }
        int sort = car.getImages().stream()
                .mapToInt(CarImage::getSort)
                .max()
                .orElse(-1) + 1;
        for (MultipartFile file : files) {
            ImageValidation.validate(file);
            car.getImages().add(CarImage.builder()
                    .car(car)
                    .contentType(file.getContentType())
                    .data(readBytes(file))
                    .sort(sort++)
                    .build());
        }
    }

    private byte[] readBytes(MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            return in.readAllBytes();
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not read uploaded file");
        }
    }

    private Car getOwnedCar(Long carId, User owner) {
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found"));
        if (!car.getOwner().getId().equals(owner.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this car");
        }
        return car;
    }

    private CarListResponse toListResponse(Car car) {
        Double avg = reviewRepository.averageRatingForCar(car.getId());
        Long count = reviewRepository.findByCarIdOrderByCreatedAtDesc(car.getId()).stream().count();
        List<String> imageUrls = car.getImages() == null ? List.of()
                : car.getImages().stream().sorted(Comparator.comparing(CarImage::getSort))
                        .map(img -> "/api/images/" + img.getId()).toList();
        return new CarListResponse(
                car.getId(), car.getOwner().getId(), car.getOwner().getFullName(),
                car.getMake(), car.getModel(), car.getYear(), car.getType(), car.getTransmission(),
                car.getSeats(), car.getFuel(), car.getDailyPrice(), car.isWithDriver(),
                car.getDriverDailyPrice(), car.getCity(), car.getLat(), car.getLng(), car.getStatus(),
                imageUrls, avg, count, car.getViewCount()
        );
    }

    private CarResponse toResponse(Car car) {
        Double avg = reviewRepository.averageRatingForCar(car.getId());
        List<CarImage> images = car.getImages() == null ? List.of()
                : car.getImages().stream().sorted(Comparator.comparing(CarImage::getSort)).toList();
        List<String> imageUrls = images.stream()
                .map(img -> "/api/images/" + img.getId())
                .toList();
        List<Long> imageIds = images.stream().map(CarImage::getId).toList();
        return new CarResponse(
                car.getId(), car.getOwner().getId(), car.getOwner().getFullName(),
                car.getMake(), car.getModel(), car.getYear(), car.getType(), car.getTransmission(),
                car.getSeats(), car.getFuel(), car.getDailyPrice(), car.isWithDriver(),
                car.getDriverDailyPrice(), car.getCity(), car.getLat(), car.getLng(), car.getDescription(),
                car.getStatus(), imageUrls, imageIds, avg, null, car.getViewCount()
        );
    }

    private Specification<Car> eqStatus(CarStatus status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }
}