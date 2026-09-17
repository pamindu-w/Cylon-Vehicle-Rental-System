package com.carrental.repositories;

import com.carrental.entities.Car;
import com.carrental.entities.enums.CarStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface CarRepository extends JpaRepository<Car, Long>, JpaSpecificationExecutor<Car> {

    List<Car> findByOwnerId(Long ownerId);

    long countByOwnerIdAndStatus(Long ownerId, CarStatus status);

    long countByStatus(CarStatus status);

    @Modifying
    @Query("UPDATE Car c SET c.viewCount = c.viewCount + 1 WHERE c.id = :id")
    void incrementViewCount(Long id);
}