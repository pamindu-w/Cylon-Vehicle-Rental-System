package com.carrental;

import com.carrental.support.IntegrationTestBase;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class AuthIntegrationTest extends IntegrationTestBase {

    private final String ownerEmail = "owner-auth-" + System.nanoTime() + "@test.com";

    @Test
    void registerLocalOwner() throws Exception {
        String token = registerOwnerAndGetToken(ownerEmail);
        org.junit.jupiter.api.Assertions.assertNotNull(token);
        org.junit.jupiter.api.Assertions.assertFalse(token.isBlank());

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(ownerEmail))
                .andExpect(jsonPath("$.role").value("OWNER"))
                .andExpect(jsonPath("$.accountType").value("LOCAL"));
    }

    @Test
    void registerCustomer() throws Exception {
        String email = "customer-auth-" + System.nanoTime() + "@test.com";
        String token = registerCustomerAndGetToken(email);
        org.junit.jupiter.api.Assertions.assertNotNull(token);
        org.junit.jupiter.api.Assertions.assertFalse(token.isBlank());

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.role").value("CUSTOMER"));
    }

    @Test
    void registerForeigner() throws Exception {
        String email = "foreigner-" + System.nanoTime() + "@test.com";
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "email", email,
                                "password", "test1234",
                                "fullName", "John Smith",
                                "phone", "+447912345678",
                                "accountType", "FOREIGNER",
                                "passportNo", "A1234567",
                                "nationality", "United Kingdom"))))
                .andExpect(status().isCreated());
    }

    @Test
    void registerDuplicateEmail() throws Exception {
        String email = "dup-" + System.nanoTime() + "@test.com";
        registerOwnerAndGetToken(email);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "email", email,
                                "password", "test1234",
                                "fullName", "Duplicate",
                                "phone", "+94771234567",
                                "accountType", "LOCAL",
                                "nic", "851234567V"))))
                .andExpect(status().isConflict());
    }

    @Test
    void loginWrongPassword() throws Exception {
        String email = "wrongpw-" + System.nanoTime() + "@test.com";
        registerOwnerAndGetToken(email);
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", email, "password", "badpassword"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void suspendedUserCannotLogin() throws Exception {
        String email = "suspended-" + System.nanoTime() + "@test.com";
        registerOwnerAndGetToken(email);
        // disable the user directly
        com.carrental.entities.User user = userRepository.findByEmail(email).orElseThrow();
        user.setEnabled(false);
        userRepository.save(user);
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", email, "password", "test1234"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meWithoutToken() throws Exception {
        mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }
}