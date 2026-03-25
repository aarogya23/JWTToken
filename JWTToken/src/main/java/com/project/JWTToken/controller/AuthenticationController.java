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
    public ResponseEntity<?> register(@RequestBody @Valid RegisterUserDto dto) {
        try {
            User registeredUser = authenticationService.signup(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(registeredUser);
        } catch (RuntimeException e) {
            System.err.println("Signup error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("message", e.getMessage() != null ? e.getMessage() : "Invalid registration details"));
        } catch (Exception e) {
            System.err.println("Signup system error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(java.util.Map.of("message", "Internal server error occurred"));
        }
    }

    /**
     * Login and get JWT token
     * POST /auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid LoginUserDto dto) {
        try {
            User authenticatedUser = authenticationService.authenticate(dto);
            String jwtToken = jwtService.generateToken(authenticatedUser);

            LoginResponse response = LoginResponse.builder()
                    .token(jwtToken)
                    .expiresIn(jwtService.getJwtExpirationMs())
                    .build();

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(java.util.Map.of("message", "Incorrect password or email"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(java.util.Map.of("message", e.getMessage()));
        } catch (Exception ex) {
            System.err.println("Login error: " + ex.getMessage());
            ex.printStackTrace();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("message", "Internal server error occurred"));
        }
    }

}
