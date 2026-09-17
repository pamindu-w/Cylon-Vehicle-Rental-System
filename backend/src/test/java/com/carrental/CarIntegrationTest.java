package com.carrental;

import com.carrental.support.IntegrationTestBase;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class CarIntegrationTest extends IntegrationTestBase {

    private final String email1 = "car-owner-" + System.nanoTime() + "@test.com";
    private final String email2 = "car-owner2-" + System.nanoTime() + "@test.com";
    private String token1;
    private String token2;

    private void initTokens() throws Exception {
        if (token1 == null) token1 = registerOwnerAndGetToken(email1);
        if (token2 == null) token2 = registerOwnerAndGetToken(email2);
    }

    @Test
    void createCarWithoutImages() throws Exception {
        initTokens();
        long id = createCar(token1, "Toyota", "Axio");
        assertTrue(id > 0);
        mockMvc.perform(get("/api/cars/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imageUrls").isArray())
                .andExpect(jsonPath("$.imageUrls.length()").value(0));
    }

    @Test
    void createCarWithImages() throws Exception {
        initTokens();
        MockMultipartFile img1 = imageFile("car1.png");
        MockMultipartFile img2 = jpegImageFile("car2.jpg");
        long id = createCar(token1, "Honda", "Fit", new MockMultipartFile[]{img1, img2});
        assertTrue(id > 0);
        mockMvc.perform(get("/api/cars/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imageUrls.length()").value(2))
                .andExpect(jsonPath("$.imageIds.length()").value(2));
    }

    @Test
    void getImagesServesBytes() throws Exception {
        initTokens();
        MockMultipartFile img = imageFile("serve.png");
        long id = createCar(token1, "Suzuki", "Alto", new MockMultipartFile[]{img});
        JsonNode car = objectMapper.readTree(
                mockMvc.perform(get("/api/cars/" + id)).andReturn().getResponse().getContentAsString());
        long imgId = car.get("imageIds").get(0).asLong();
        mockMvc.perform(get("/api/images/" + imgId))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/png"))
                .andExpect(content().bytes(img.getBytes()));
    }

    @Test
    void deleteImage() throws Exception {
        initTokens();
        MockMultipartFile img = imageFile("del.png");
        long id = createCar(token1, "Kia", "Picanto", new MockMultipartFile[]{img});
        JsonNode car = objectMapper.readTree(
                mockMvc.perform(get("/api/cars/" + id)).andReturn().getResponse().getContentAsString());
        long imgId = car.get("imageIds").get(0).asLong();
        mockMvc.perform(delete("/api/cars/" + id + "/images/" + imgId)
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/images/" + imgId))
                .andExpect(status().isNotFound());
    }

    @Test
    void publicSearchListsActiveCars() throws Exception {
        initTokens();
        createCar(token1, "Public", "Search");
        mockMvc.perform(get("/api/cars"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[?(@.make == 'Public')]").exists());
    }

    @Test
    void nonOwnerCannotUpdateCar() throws Exception {
        initTokens();
        long id = createCar(token1, "OwnerA", "Car");
        mockMvc.perform(put("/api/cars/" + id)
                        .header("Authorization", "Bearer " + token2)
                        .contentType("application/json")
                        .content(json(carUpdateFields("OwnerA", "Car", 8000))))
                .andExpect(status().isForbidden());
    }

    @Test
    void validationFailsForMissingMake() throws Exception {
        initTokens();
        MockMultipartFile carPart = new MockMultipartFile(
                "car", "", "application/json",
                json(java.util.Map.of(
                        "model", "Axio", "year", 2020, "type", "SEDAN",
                        "transmission", "AUTOMATIC", "seats", 5, "fuel", "PETROL",
                        "dailyPrice", 8000, "withDriver", false, "city", "Colombo")).getBytes());
        mockMvc.perform(multipart("/api/cars")
                        .file(carPart)
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isBadRequest());
    }
}