package com.carrental.services;

import com.carrental.entities.User;
import com.carrental.repositories.UserRepository;
import com.carrental.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class CurrentUserResolver {

    private final UserRepository userRepository;

    public CurrentUserResolver(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User get() {
        UserPrincipal principal = principal();
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User no longer exists"));
    }

    public UserPrincipal principal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return principal;
    }
}