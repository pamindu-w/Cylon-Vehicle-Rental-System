package com.carrental.config;

import com.carrental.entities.Car;
import com.carrental.entities.User;
import com.carrental.entities.enums.AccountType;
import com.carrental.entities.enums.CarStatus;
import com.carrental.entities.enums.CarType;
import com.carrental.entities.enums.FuelType;
import com.carrental.entities.enums.Role;
import com.carrental.entities.enums.Transmission;
import com.carrental.repositories.CarRepository;
import com.carrental.repositories.UserRepository;
import java.math.BigDecimal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class SeedData implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SeedData.class);

    private final UserRepository userRepository;
    private final CarRepository carRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean enabled;

    public SeedData(UserRepository userRepository,
                    CarRepository carRepository,
                    PasswordEncoder passwordEncoder,
                    @Value("${app.seed-data}") boolean enabled) {
        this.userRepository = userRepository;
        this.carRepository = carRepository;
        this.passwordEncoder = passwordEncoder;
        this.enabled = enabled;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!enabled) {
            return;
        }

        User owner = userRepository.findByEmail("owner@test.com").orElseGet(() -> {
            User user = User.builder()
                    .email("owner@test.com")
                    .passwordHash(passwordEncoder.encode("test1234"))
                    .fullName("Nimal Perera")
                    .businessName("Perera Rentals")
                    .phone("+94771234567")
                    .role(Role.OWNER)
                    .accountType(AccountType.LOCAL)
                    .nic("851234567V")
                    .build();
            log.info("Seeding demo owner user");
            return userRepository.save(user);
        });

        if (userRepository.findByEmail("admin@test.com").isEmpty()) {
            User admin = User.builder()
                    .email("admin@test.com")
                    .passwordHash(passwordEncoder.encode("admin1234"))
                    .fullName("System Admin")
                    .phone("+94770000000")
                    .role(Role.ADMIN)
                    .accountType(AccountType.LOCAL)
                    .nic("780000000V")
                    .build();
            userRepository.save(admin);
            log.info("Seeding demo admin user");
        }

        if (userRepository.findByEmail("foreign-owner@test.com").isEmpty()) {
            User foreigner = User.builder()
                    .email("foreign-owner@test.com")
                    .passwordHash(passwordEncoder.encode("test1234"))
                    .fullName("John Smith")
                    .businessName("Ceylon Tours")
                    .phone("+94771112233")
                    .role(Role.OWNER)
                    .accountType(AccountType.FOREIGNER)
                    .passportNo("A1234567")
                    .nationality("United Kingdom")
                    .build();
            userRepository.save(foreigner);
            log.info("Seeding demo foreigner owner user");
        }

        if (userRepository.findByEmail("customer@test.com").isEmpty()) {
            User customer = User.builder()
                    .email("customer@test.com")
                    .passwordHash(passwordEncoder.encode("test1234"))
                    .fullName("Kamal Silva")
                    .phone("+94771114455")
                    .role(Role.CUSTOMER)
                    .accountType(AccountType.LOCAL)
                    .nic("832345678V")
                    .build();
            userRepository.save(customer);
            log.info("Seeding demo customer user");
        }

        seedCarIfMissing("Toyota", "Axio", CarType.SEDAN, "Colombo",
                6.9324, 79.8509, new BigDecimal("9000"), owner);
        seedCarIfMissing("Suzuki", "Swift", CarType.SEDAN, "Kandy",
                7.2906, 80.6337, new BigDecimal("7500"), owner);
        seedCarIfMissing("Honda", "Vezel", CarType.SUV, "Galle",
                6.0535, 80.2210, new BigDecimal("11000"), owner);
        seedCarIfMissing("Kia", "Grand Carnival", CarType.VAN, "Colombo",
                6.9271, 79.8612, new BigDecimal("14000"), owner);
        log.info("Seed data check complete");
    }

    private void seedCarIfMissing(String make, String model, CarType type, String city,
                                  double lat, double lng, BigDecimal dailyPrice, User owner) {
        boolean exists = carRepository.findAll().stream()
                .anyMatch(c -> c.getOwner().getId().equals(owner.getId())
                        && c.getMake().equalsIgnoreCase(make)
                        && c.getModel().equalsIgnoreCase(model));
        if (exists) {
            return;
        }
        Car car = Car.builder()
                .owner(owner)
                .make(make)
                .model(model)
                .year(2020)
                .type(type)
                .transmission(Transmission.AUTOMATIC)
                .seats(type == CarType.VAN ? 7 : 5)
                .fuel(FuelType.PETROL)
                .dailyPrice(dailyPrice)
                .withDriver(true)
                .driverDailyPrice(new BigDecimal("2500"))
                .city(city)
                .lat(lat)
                .lng(lng)
                .description("Well-maintained " + make + " " + model + " available in " + city
                        + ", with and without driver.")
                .status(CarStatus.ACTIVE)
                .build();
        carRepository.save(car);
        log.info("Seeded sample car: {} {}", make, model);
    }
}