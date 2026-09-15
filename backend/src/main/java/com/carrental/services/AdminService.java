package com.carrental.services;

import com.carrental.dto.AdminReviewResponse;
import com.carrental.dto.AdminStatsResponse;
import com.carrental.dto.CarListResponse;
import com.carrental.dto.UserResponse;
import com.carrental.dto.CarResponse;
import com.carrental.dto.BookingResponse;
import com.carrental.entities.enums.BookingStatus;
import com.carrental.entities.enums.CarStatus;
import com.carrental.entities.enums.Role;
import com.carrental.entities.User;
import com.carrental.repositories.BookingRepository;
import com.carrental.repositories.CarRepository;
import com.carrental.repositories.ReviewRepository;
import com.carrental.repositories.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final CarRepository carRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final CarService carService;
    private final BookingService bookingService;

    public AdminService(UserRepository userRepository,
                        CarRepository carRepository,
                        BookingRepository bookingRepository,
                        ReviewRepository reviewRepository,
                        CarService carService,
                        BookingService bookingService) {
        this.userRepository = userRepository;
        this.carRepository = carRepository;
        this.bookingRepository = bookingRepository;
        this.reviewRepository = reviewRepository;
        this.carService = carService;
        this.bookingService = bookingService;
    }

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        long totalUsers = userRepository.count();
        long totalOwners = userRepository.countByRole(Role.OWNER);
        long totalCars = carRepository.count();
        long activeCars = carRepository.countByStatus(CarStatus.ACTIVE);
        long hiddenCars = carRepository.countByStatus(CarStatus.HIDDEN);
        long totalBookings = bookingRepository.count();
        long pendingBookings = bookingRepository.countByStatus(BookingStatus.PENDING);
        long confirmedBookings = bookingRepository.countByStatus(BookingStatus.CONFIRMED);
        long completedBookings = bookingRepository.countByStatus(BookingStatus.COMPLETED);
        long cancelledBookings = bookingRepository.countByStatus(BookingStatus.CANCELLED);
        BigDecimal totalRevenue = bookingRepository.sumTotalPriceByStatus(
                List.of(BookingStatus.CONFIRMED, BookingStatus.ACTIVE, BookingStatus.COMPLETED));
        return new AdminStatsResponse(
                totalUsers, totalOwners,
                totalCars, activeCars, hiddenCars,
                totalBookings, pendingBookings, confirmedBookings, completedBookings, cancelledBookings,
                totalRevenue
        );
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse getUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse setUserEnabled(Long id, boolean enabled, Long adminId) {
        if (id.equals(adminId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot suspend your own account");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setEnabled(enabled);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<CarListResponse> listAllCars() {
        return carService.getAllCars();
    }

    @Transactional
    public CarResponse setCarStatus(Long id, CarStatus status) {
        return carService.adminSetStatus(id, status);
    }

    @Transactional
    public void deleteCar(Long id) {
        carService.adminDeleteCar(id);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> listAllBookings() {
        return bookingService.getAllBookings();
    }

    @Transactional
    public BookingResponse setBookingStatus(Long id, BookingStatus status) {
        return bookingService.adminSetStatus(id, status);
    }

    @Transactional(readOnly = true)
    public List<AdminReviewResponse> listAllReviews() {
        return reviewRepository.findAll().stream()
                .map(AdminReviewResponse::from)
                .toList();
    }

    @Transactional
    public void deleteReview(Long id) {
        if (!reviewRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found");
        }
        reviewRepository.deleteById(id);
    }
}