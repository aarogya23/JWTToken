package com.project.JWTToken.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.project.JWTToken.Service.AuthenticationService;
import com.project.JWTToken.Service.JwtService;
import com.project.JWTToken.model.User;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final AuthenticationService authenticationService;
    private final JwtService jwtService;

    /**
     * Get current user profile
     * GET /api/profile
     */
    @GetMapping
    public ResponseEntity<User> getProfile(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.replace("Bearer ", "");
            String email = jwtService.extractUsername(jwt);
            User user = authenticationService.getUserByEmail(email);
            if (user != null) {
                return ResponseEntity.ok(user);
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            System.err.println("Error fetching profile: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    /**
     * Update user profile (bio, location, full name, profile image)
     * PUT /api/profile
     */
    @PutMapping
    public ResponseEntity<User> updateProfile(
            @RequestHeader("Authorization") String token,
            @RequestBody User profileUpdate) {
        try {
            String jwt = token.replace("Bearer ", "");
            String email = jwtService.extractUsername(jwt);
            User user = authenticationService.getUserByEmail(email);
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            // Update allowed fields
            if (profileUpdate.getFullName() != null && !profileUpdate.getFullName().isEmpty()) {
                user.setFullName(profileUpdate.getFullName());
            }
            if (profileUpdate.getBio() != null) {
                user.setBio(profileUpdate.getBio());
            }
            if (profileUpdate.getLocation() != null) {
                user.setLocation(profileUpdate.getLocation());
            }
            if (profileUpdate.getProfileImage() != null) {
                user.setProfileImage(profileUpdate.getProfileImage());
            }

            User updatedUser = authenticationService.updateUser(user);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            System.err.println("Error updating profile: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
