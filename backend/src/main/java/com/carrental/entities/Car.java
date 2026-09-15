package com.carrental.entities;

import com.carrental.entities.enums.CarStatus;
import com.carrental.entities.enums.CarType;
import com.carrental.entities.enums.FuelType;
import com.carrental.entities.enums.Transmission;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "cars")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Car {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private String make;

    @Column(nullable = false)
    private String model;

    @Column(nullable = false)
    private Integer year;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private CarType type;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private Transmission transmission;

    @Column(nullable = false)
    private Integer seats;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private FuelType fuel;

    @Builder.Default
    @Column(name = "daily_price", nullable = false)
    private BigDecimal dailyPrice = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "with_driver", nullable = false)
    private boolean withDriver = false;

    @Column(name = "driver_daily_price")
    private BigDecimal driverDailyPrice;

    @Column(nullable = false)
    private String city;

    private Double lat;

    private Double lng;

    @Column(columnDefinition = "text")
    private String description;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private CarStatus status = CarStatus.DRAFT;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    @Builder.Default
    @OneToMany(mappedBy = "car", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CarImage> images = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "car")
    private List<Booking> bookings = new ArrayList<>();
}