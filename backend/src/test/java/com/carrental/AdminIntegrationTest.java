package com.carrental;

import com.carrental.support.IntegrationTestBase;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class AdminIntegrationTest extends IntegrationTestBase {

    private final String adminEmail = "admin-" + System.nanoTime() + "@test.com";
    private final String ownerEmail = "adm-owner-" + System.nanoTime() + "@test.com";

    @Test
    void statsEndpoint() throws Exception {
        String adminToken = createAdminAndGetToken(adminEmail);
        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").isNumber())
                .andExpect(jsonPath("$.totalCars").isNumber());
    }

    @Test
    void nonAdminCannotAccessStats() throws Exception {
        String ownerToken = registerOwnerAndGetToken(ownerEmail);
        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanCancelBooking() throws Exception {
        String adminToken = createAdminAndGetToken(adminEmail);
        String ownerToken = registerOwnerAndGetToken(ownerEmail);
        String customerToken = registerCustomerAndGetToken("adm-cust-" + System.nanoTime() + "@test.com");
        long carId = createCar(ownerToken, "Toyota", "Axio");
        long bookingId = createBooking(customerToken, carId,
                java.time.LocalDate.now().plusDays(10).toString(),
                java.time.LocalDate.now().plusDays(12).toString());
        mockMvc.perform(patch("/api/admin/bookings/" + bookingId + "/status?status=CANCELLED")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void adminCannotSuspendSelf() throws Exception {
        String adminToken = createAdminAndGetToken(adminEmail);
        // find own user id
        com.carrental.entities.User admin = userRepository.findByEmail(adminEmail).orElseThrow();
        mockMvc.perform(patch("/api/admin/users/" + admin.getId() + "/enabled?enabled=false")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }
}