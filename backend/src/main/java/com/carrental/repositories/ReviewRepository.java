package com.carrental.repositories;

import com.carrental.entities.Review;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByCarIdOrderByCreatedAtDesc(Long carId);

    boolean existsByBookingId(Long bookingId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.car.id = :carId")
    Double averageRatingForCar(@Param("carId") Long carId);
}