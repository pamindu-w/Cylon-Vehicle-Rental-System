package com.carrental;

import com.carrental.support.IntegrationTestBase;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class ImageAvatarIntegrationTest extends IntegrationTestBase {

    @Test
    void avatarUploadAndServe() throws Exception {
        String email = "avatar-" + System.nanoTime() + "@test.com";
        String token = registerOwnerAndGetToken(email);
        MockMultipartFile avatar = new MockMultipartFile("file", "avatar.png", "image/png",
                imageFile("avatar.png").getBytes());
        MvcResult uploadResult = mockMvc.perform(multipart("/api/auth/me/avatar")
                        .file(avatar)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isOk())
                .andReturn();
        assertTrue(objectMapper.readTree(uploadResult.getResponse().getContentAsString())
                .get("avatarUrl").asText().matches("/api/users/\\d+/avatar"));

        JsonNode userNode = objectMapper.readTree(
                mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                        .andReturn().getResponse().getContentAsString());
        String avatarUrl = userNode.get("avatarUrl").asText();
        mockMvc.perform(get(avatarUrl))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/png"));
    }

    @Test
    void profileUpdate() throws Exception {
        String email = "prof-" + System.nanoTime() + "@test.com";
        String token = registerOwnerAndGetToken(email);
        mockMvc.perform(patch("/api/auth/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("fullName", "Updated Name", "phone", "+94771111111"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Updated Name"));
    }
}