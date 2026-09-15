package com.carrental.repositories;

import com.carrental.entities.Booking;
import com.carrental.entities.enums.BookingStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByCarIdOrderByCreatedAtDesc(Long carId);

    List<Booking> findAllByOrderByCreatedAtDesc();

    List<Booking> findByStatusInAndEndDateBefore(List<BookingStatus> statuses, LocalDate date);

    long countByCarId(Long carId);

    long countByStatus(BookingStatus status);

    @Query("""
            SELECT COALESCE(SUM(b.totalPrice), 0) FROM Booking b
            WHERE b.status IN :statuses
            """)
    BigDecimal sumTotalPriceByStatus(@Param("statuses") List<BookingStatus> statuses);

    @Query("""
            SELECT COUNT(b) > 0 FROM Booking b
            WHERE b.car.id = :carId
              AND b.status IN :statuses
              AND b.startDate <= :endDate
              AND b.endDate >= :startDate
            """)
    boolean existsOverlapping(@Param("carId") Long carId,
                              @Param("startDate") LocalDate startDate,
                              @Param("endDate") LocalDate endDate,
                              @Param("statuses") List<BookingStatus> statuses);
}