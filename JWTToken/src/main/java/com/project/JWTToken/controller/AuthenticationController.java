package com.project.JWTToken.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.project.JWTToken.Service.AuthenticationService;
import com.project.JWTToken.Service.JwtService;
import com.project.JWTToken.dtos.LoginResponse;
import com.project.JWTToken.dtos.LoginUserDto;
import com.project.JWTToken.dtos.RegisterUserDto;
import com.project.JWTToken.model.User;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final JwtService jwtService;

    /**
     * Register a new user
     * POST /auth/signup
     */
    @PostMapping("/signup")
    public ResponseEntity<User> register(@RequestBody @Valid RegisterUserDto dto) {
        User registeredUser = authenticationService.signup(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(registeredUser);
    }

    /**
     * Login and get JWT token
     * POST /auth/login
     */
    @PostMapping("/login")
public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginUserDto dto) {
    try {
        User authenticatedUser = authenticationService.authenticate(dto);
        String jwtToken = jwtService.generateToken(authenticatedUser);

        // Build response
        LoginResponse response = LoginResponse.builder()
                .token(jwtToken)                          // ← fixed
                .expiresIn(jwtService.getJwtExpirationMs())
                .build();

        return ResponseEntity.ok(response);

    } catch (BadCredentialsException e) {                 // ← fixed spelling

        LoginResponse errorResponse = LoginResponse.builder()
                .token(null)                              // ← fixed
                .expiresIn(0)
                .build();

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(errorResponse);
    } catch (Exception ex) {
        // optional: catch unexpected errors
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
}
}