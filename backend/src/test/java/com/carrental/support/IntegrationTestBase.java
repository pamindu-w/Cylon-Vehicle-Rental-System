package com.carrental.support;

import com.carrental.entities.enums.AccountType;
import com.carrental.entities.enums.Role;
import com.carrental.entities.User;
import com.carrental.repositories.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class IntegrationTestBase {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    protected String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    protected String readToken(MvcResult result) throws Exception {
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return node.get("token").asText();
    }

    protected String registerOwnerAndGetToken(String email) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                        "email", email,
                        "password", "test1234",
                        "fullName", "Test Owner",
                        "phone", "+94771234567",
                        "accountType", "LOCAL",
                        "nic", "851234567V"))))
                .andExpect(status().isCreated());
        return loginGetToken(email, "test1234");
    }

    protected String loginGetToken(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn();
        return readToken(result);
    }

    protected String registerCustomerAndGetToken(String email) throws Exception {
        mockMvc.perform(post("/api/auth/register/customer")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                        "email", email,
                        "password", "test1234",
                        "fullName", "Test Customer",
                        "phone", "+94779999999",
                        "accountType", "LOCAL",
                        "nic", "881234567V"))))
                .andExpect(status().isCreated());
        return loginGetToken(email, "test1234");
    }

    protected String createAdminAndGetToken(String email) throws Exception {
        userRepository.save(User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode("test1234"))
                .fullName("System Admin")
                .phone("+94770000000")
                .role(Role.ADMIN)
                .accountType(AccountType.LOCAL)
                .nic("780000000V")
                .build());
        return loginGetToken(email, "test1234");
    }

    protected long createCar(String token, String make, String model) throws Exception {
        return createCar(token, make, model, null);
    }

    protected long createCar(String token, String make, String model, MockMultipartFile[] images) throws Exception {
        var carFields = new HashMap<String, Object>();
        carFields.put("make", make);
        carFields.put("model", model);
        carFields.put("year", 2020);
        carFields.put("type", "SEDAN");
        carFields.put("transmission", "AUTOMATIC");
        carFields.put("seats", 5);
        carFields.put("fuel", "PETROL");
        carFields.put("dailyPrice", 9000);
        carFields.put("withDriver", false);
        carFields.put("city", "Colombo");
        carFields.put("status", "ACTIVE");
        MockMultipartFile carPart = new MockMultipartFile(
                "car", "", "application/json",
                json(carFields).getBytes());

        MockMultipartHttpServletRequestBuilder builder = multipart("/api/cars")
                .file(carPart);
        if (images != null) {
            for (MockMultipartFile img : images) {
                builder.file(img);
            }
        }
        builder.with(authToken(token));
        MvcResult result = mockMvc.perform(builder)
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    protected MockMultipartFile imageFile(String name) throws Exception {
        byte[] png = new byte[]{
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG header
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
                0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
                0x08, 0x02, 0x00, 0x00, 0x00, 0x03, 0x49, 0x48,
                0x44, 0x41, 0x54, 0x08, (byte) 0xD7, (byte) 0x63, (byte) 0xF8, (byte) 0xCF,
                (byte) 0xC0, 0x00, 0x00, 0x01, 0x01, 0x01, 0x00, 0x00,
                0x00, 0x40, (byte) 0x82, (byte) 0x8F, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, 0x3F,
                0x00, 0x03, 0x01, 0x01, 0x00, 0x05, 0x00, 0x01,
                (byte) 0xD4, 0x24, 0x73, (byte) 0xDB, 0x56, 0x00, 0x00, 0x00,
                0x00, 0x49, 0x45, 0x4E, 0x44, (byte) 0xAE, 0x42, 0x60, (byte) 0x82 // IEND
        };
        return new MockMultipartFile("files", name, "image/png", png);
    }

    protected MockMultipartFile jpegImageFile(String name) throws Exception {
        // Minimal JFIF JPEG with 1x1 pixel
        byte[] jpeg = new byte[]{
                (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
                0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, (byte) 0xFF, (byte) 0xDB, 0x00, 0x43, 0x00,
                0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C,
                0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12, 0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E,
                0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28,
                0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32, 0x3C,
                0x2E, 0x33, 0x34, 0x32, (byte) 0xFF, (byte) 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01,
                0x01, 0x01, 0x11, 0x00, (byte) 0xFF, (byte) 0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01,
                0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02,
                0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, (byte) 0xFF, (byte) 0xC4, 0x00, (byte) 0xB5,
                0x10, 0x00, 0x02, 0x01, 0x03, 0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00,
                0x01, 0x7D, 0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13,
                0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, (byte) 0x81, (byte) 0x91, (byte) 0xA1, 0x08, 0x23,
                0x42, (byte) 0xB1, (byte) 0xC1, 0x15, 0x52, (byte) 0xD1, (byte) 0xF0, 0x24, 0x33, 0x62, 0x72,
                (byte) 0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A,
                0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4A,
                0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69,
                0x6A, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7A, (byte) 0x83, (byte) 0x84, (byte) 0x85,
                (byte) 0x86, (byte) 0x87, (byte) 0x88, (byte) 0x89, (byte) 0x8A, (byte) 0x92, (byte) 0x93,
                (byte) 0x94, (byte) 0x95, (byte) 0x96, (byte) 0x97, (byte) 0x98, (byte) 0x99, (byte) 0x9A,
                (byte) 0xA2, (byte) 0xA3, (byte) 0xA4, (byte) 0xA5, (byte) 0xA6, (byte) 0xA7, (byte) 0xA8,
                (byte) 0xA9, (byte) 0xAA, (byte) 0xB2, (byte) 0xB3, (byte) 0xB4, (byte) 0xB5, (byte) 0xB6,
                (byte) 0xB7, (byte) 0xB8, (byte) 0xB9, (byte) 0xBA, (byte) 0xC2, (byte) 0xC3, (byte) 0xC4,
                (byte) 0xC5, (byte) 0xC6, (byte) 0xC7, (byte) 0xC8, (byte) 0xC9, (byte) 0xCA, (byte) 0xD2,
                (byte) 0xD3, (byte) 0xD4, (byte) 0xD5, (byte) 0xD6, (byte) 0xD7, (byte) 0xD8, (byte) 0xD9,
                (byte) 0xDA, (byte) 0xE1, (byte) 0xE2, (byte) 0xE3, (byte) 0xE4, (byte) 0xE5, (byte) 0xE6,
                (byte) 0xE7, (byte) 0xE8, (byte) 0xE9, (byte) 0xEA, (byte) 0xF1, (byte) 0xF2, (byte) 0xF3,
                (byte) 0xF4, (byte) 0xF5, (byte) 0xF6, (byte) 0xF7, (byte) 0xF8, (byte) 0xF9, (byte) 0xFA,
                (byte) 0xFF, (byte) 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
                (byte) 0x7B, (byte) 0x94, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00,
                (byte) 0xFF, (byte) 0xD9
        };
        return new MockMultipartFile("files", name, "image/jpeg", jpeg);
    }

    protected long createBooking(String customerToken, long carId, String start, String end) throws Exception {
        return createBooking(customerToken, carId, start, end, false);
    }

    protected long createBooking(String customerToken, long carId, String start, String end,
                                 boolean withDriver) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "carId", carId,
                                "startDate", start,
                                "endDate", end,
                                "withDriver", withDriver))))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    protected Map<String, Object> carUpdateFields(String make, String model, int dailyPrice) {
        var fields = new HashMap<String, Object>();
        fields.put("make", make);
        fields.put("model", model);
        fields.put("year", 2020);
        fields.put("type", "SEDAN");
        fields.put("transmission", "AUTOMATIC");
        fields.put("seats", 5);
        fields.put("fuel", "PETROL");
        fields.put("dailyPrice", dailyPrice);
        fields.put("withDriver", false);
        fields.put("city", "Colombo");
        fields.put("status", "ACTIVE");
        return fields;
    }

    private static RequestPostProcessor authToken(String token) {
        return request -> {
            request.addHeader("Authorization", "Bearer " + token);
            return request;
        };
    }
}