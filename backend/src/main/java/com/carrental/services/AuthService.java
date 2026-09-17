package com.carrental.services;

import com.carrental.dto.AuthResponse;
import com.carrental.dto.AvatarData;
import com.carrental.dto.CustomerRegisterRequest;
import com.carrental.dto.LoginRequest;
import com.carrental.dto.ProfileUpdateRequest;
import com.carrental.dto.RegisterRequest;
import com.carrental.dto.UserResponse;
import com.carrental.entities.User;
import com.carrental.entities.enums.AccountType;
import com.carrental.entities.enums.Role;
import com.carrental.repositories.UserRepository;
import com.carrental.security.JwtUtil;
import com.carrental.security.UserPrincipal;
import jakarta.validation.Valid;
import java.io.IOException;
import java.io.InputStream;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(@Valid RegisterRequest request) {
        if (userRepository.existsByEmail(request.email().toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        validateIdentityFields(request.accountType(), request.nic(), request.passportNo(), request.nationality());

        User user = User.builder()
                .email(request.email().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .businessName(normalize(request.businessName()))
                .phone(request.phone().trim())
                .role(Role.OWNER)
                .accountType(request.accountType())
                .nic(request.accountType() == AccountType.LOCAL ? request.nic().trim() : null)
                .passportNo(request.accountType() == AccountType.FOREIGNER ? request.passportNo().trim() : null)
                .nationality(request.accountType() == AccountType.FOREIGNER ? request.nationality().trim() : null)
                .build();

        User saved = userRepository.save(user);
        String token = jwtUtil.generateToken(saved.getEmail(), saved.getRole().name(), saved.getId());
        return AuthResponse.from(token, saved);
    }

    @Transactional
    public AuthResponse registerCustomer(@Valid CustomerRegisterRequest request) {
        if (userRepository.existsByEmail(request.email().toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        validateIdentityFields(request.accountType(), request.nic(), request.passportNo(), request.nationality());

        User user = User.builder()
                .email(request.email().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .phone(request.phone().trim())
                .role(Role.CUSTOMER)
                .accountType(request.accountType())
                .nic(request.accountType() == AccountType.LOCAL ? request.nic().trim() : null)
                .passportNo(request.accountType() == AccountType.FOREIGNER ? request.passportNo().trim() : null)
                .nationality(request.accountType() == AccountType.FOREIGNER ? request.nationality().trim() : null)
                .build();

        User saved = userRepository.save(user);
        String token = jwtUtil.generateToken(saved.getEmail(), saved.getRole().name(), saved.getId());
        return AuthResponse.from(token, saved);
    }

    public AuthResponse login(@Valid LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email().toLowerCase(), request.password()));
            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            User user = userRepository.findByEmail(principal.getUsername())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
            return AuthResponse.from(token, user);
        } catch (org.springframework.security.core.AuthenticationException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
    }

    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateProfile(User user, @Valid ProfileUpdateRequest request) {
        user.setFullName(request.fullName().trim());
        user.setBusinessName(normalize(request.businessName()));
        user.setPhone(request.phone().trim());
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateAvatar(User user, MultipartFile file) {
        ImageValidation.validate(file);
        user.setAvatarData(readBytes(file));
        user.setAvatarContentType(file.getContentType());
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public AvatarData getAvatar(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (user.getAvatarData() == null || user.getAvatarContentType() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No avatar");
        }
        return new AvatarData(user.getAvatarData(), user.getAvatarContentType());
    }

    private byte[] readBytes(MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            return in.readAllBytes();
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not read uploaded file");
        }
    }

    private void validateIdentityFields(AccountType accountType, String nic, String passportNo, String nationality) {
        if (accountType == AccountType.LOCAL) {
            if (nic == null || nic.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "NIC is required for Sri Lankan local registrations");
            }
            if (passportNo != null || nationality != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Locals must not provide passport or nationality");
            }
        } else {
            if (passportNo == null || passportNo.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Passport number is required for foreigner registrations");
            }
            if (nationality == null || nationality.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Nationality is required for foreigner registrations");
            }
            if (nic != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Foreigners must not provide a Sri Lankan NIC");
            }
        }
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}