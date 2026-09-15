package com.carrental.repositories;

import com.carrental.entities.Payment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByBookingId(Long bookingId);
}