package com.carrental.services;

import com.carrental.dto.BookingRequest;
import com.carrental.dto.BookingResponse;
import com.carrental.entities.Booking;
import com.carrental.entities.Car;
import com.carrental.entities.User;
import com.carrental.entities.enums.AccountType;
import com.carrental.entities.enums.BookingStatus;
import com.carrental.entities.enums.IdType;
import com.carrental.repositories.BookingRepository;
import com.carrental.repositories.CarRepository;
import com.carrental.repositories.ReviewRepository;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final CarRepository carRepository;
    private final ReviewRepository reviewRepository;
    private final int cancelFreeHours;

    public BookingService(BookingRepository bookingRepository,
                          CarRepository carRepository,
                          ReviewRepository reviewRepository,
                          @Value("${app.booking.cancel-free-hours}") int cancelFreeHours) {
        this.bookingRepository = bookingRepository;
        this.carRepository = carRepository;
        this.reviewRepository = reviewRepository;
        this.cancelFreeHours = cancelFreeHours;
    }

    @Transactional
    public BookingResponse create(@Valid BookingRequest request, User customer) {
        Car car = carRepository.findById(request.carId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found"));

        if (request.startDate().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start date cannot be in the past");
        }
        if (request.endDate().isBefore(request.startDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End date must be on or after start date");
        }

        long days = ChronoUnit.DAYS.between(request.startDate(), request.endDate()) + 1;
        BigDecimal daily = car.getDailyPrice();
        if (request.withDriver()) {
            if (car.getDriverDailyPrice() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "This car does not offer the rent-with-driver option");
            }
            daily = daily.add(car.getDriverDailyPrice());
        }
        BigDecimal totalPrice = daily.multiply(BigDecimal.valueOf(days));

        if (bookingRepository.existsOverlapping(request.carId(), request.startDate(), request.endDate(),
                List.of(BookingStatus.CONFIRMED, BookingStatus.ACTIVE, BookingStatus.PENDING))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This car is already booked for the requested dates");
        }

        boolean withDriver = request.withDriver();
        boolean isLocal = customer.getAccountType() == AccountType.LOCAL;
        Booking booking = Booking.builder()
                .car(car)
                .user(customer)
                .guestName(customer.getFullName().trim())
                .guestEmail(customer.getEmail().toLowerCase().trim())
                .guestPhone(customer.getPhone().trim())
                .guestIdType(isLocal ? IdType.NIC : IdType.PASSPORT)
                .guestIdNumber((isLocal ? customer.getNic() : customer.getPassportNo()).trim())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .withDriver(withDriver)
                .pickupLocation(request.pickupLocation())
                .totalPrice(totalPrice)
                .status(BookingStatus.PENDING)
                .build();

        return BookingResponse.from(bookingRepository.save(booking));
    }

    @Transactional(readOnly = true)
    public BookingResponse getForOwner(Long bookingId, User owner) {
        Booking booking = getOwnedBooking(bookingId, owner);
        return BookingResponse.from(booking);
    }

    @Transactional
    public BookingResponse cancel(Long bookingId, User customer) {
        Booking booking = getCustomerBooking(bookingId, customer);
        if (!BookingPolicy.canCancel(booking.getStatus(), LocalDateTime.now(),
                booking.getStartDate(), cancelFreeHours)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This booking can no longer be cancelled online. Please contact the owner.");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        return BookingResponse.from(bookingRepository.save(booking));
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getMyRentals(User customer) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(customer.getId()).stream()
                .map(booking -> BookingResponse.from(booking,
                        reviewRepository.existsByBookingId(booking.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(User owner) {
        return carRepository.findByOwnerId(owner.getId()).stream()
                .flatMap(car -> bookingRepository.findByCarIdOrderByCreatedAtDesc(car.getId()).stream())
                .map(BookingResponse::from)
                .toList();
    }

    @Transactional
    public BookingResponse setStatus(Long bookingId, BookingStatus status, User owner) {
        if (status != BookingStatus.CONFIRMED && status != BookingStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Owners may only confirm or cancel bookings");
        }
        Booking booking = getOwnedBooking(bookingId, owner);
        if (booking.getStatus() == BookingStatus.CANCELLED
                || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Booking is already " + booking.getStatus().name().toLowerCase());
        }
        booking.setStatus(status);
        return BookingResponse.from(bookingRepository.save(booking));
    }

    @Transactional
    public void completeExpiredBookings() {
        List<Booking> expired = bookingRepository.findByStatusInAndEndDateBefore(
                List.of(BookingStatus.CONFIRMED, BookingStatus.ACTIVE), LocalDate.now());
        for (Booking booking : expired) {
            booking.setStatus(BookingStatus.COMPLETED);
        }
        if (!expired.isEmpty()) {
            bookingRepository.saveAll(expired);
        }
    }

    @Transactional
    public void processScheduledTransitions() {
        List<Booking> toActivate = bookingRepository.findByStatusAndStartDateLessThanEqual(
                BookingStatus.CONFIRMED, LocalDate.now());
        for (Booking booking : toActivate) {
            booking.setStatus(BookingStatus.ACTIVE);
        }
        if (!toActivate.isEmpty()) {
            bookingRepository.saveAll(toActivate);
        }

        List<Booking> stalePending = bookingRepository.findByStatusAndStartDateBefore(
                BookingStatus.PENDING, LocalDate.now());
        for (Booking booking : stalePending) {
            booking.setStatus(BookingStatus.CANCELLED);
        }
        if (!stalePending.isEmpty()) {
            bookingRepository.saveAll(stalePending);
        }

        completeExpiredBookings();
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(BookingResponse::from)
                .toList();
    }

    @Transactional
    public BookingResponse adminSetStatus(Long bookingId, BookingStatus status) {
        if (status != BookingStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Admins may only cancel bookings");
        }
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        if (booking.getStatus() == BookingStatus.CANCELLED
                || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Booking is already " + booking.getStatus().name().toLowerCase());
        }
        booking.setStatus(status);
        return BookingResponse.from(bookingRepository.save(booking));
    }

    private Booking getOwnedBooking(Long bookingId, User owner) {
        Booking booking = findBooking(bookingId);
        if (!booking.getCar().getOwner().getId().equals(owner.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not manage this booking");
        }
        return booking;
    }

    private Booking getCustomerBooking(Long bookingId, User customer) {
        Booking booking = findBooking(bookingId);
        if (booking.getUser() == null || !booking.getUser().getId().equals(customer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not manage this booking");
        }
        return booking;
    }

    private Booking findBooking(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
    }
}