package com.project.JWTToken.controller;

import com.project.JWTToken.Service.AuthenticationService;
import com.project.JWTToken.Service.JwtService;
import com.project.JWTToken.Service.LogisticsRequestService;
import com.project.JWTToken.dtos.LogisticsRequestDto;
import com.project.JWTToken.model.LogisticsRequest;
import com.project.JWTToken.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logistics-requests")
@RequiredArgsConstructor
public class LogisticsRequestController {

    private final LogisticsRequestService logisticsRequestService;
    private final AuthenticationService authenticationService;
    private final JwtService jwtService;

    @PostMapping
    public ResponseEntity<?> createRequest(
            @RequestHeader("Authorization") String token,
            @RequestBody LogisticsRequestDto dto) {
        try {
            String jwt = token.replace("Bearer ", "");
            String email = jwtService.extractUsername(jwt);
            User user = authenticationService.getUserByEmail(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            LogisticsRequest request = logisticsRequestService.createRequest(user, dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(request);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/mine")
    public ResponseEntity<?> getMyRequests(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.replace("Bearer ", "");
            String email = jwtService.extractUsername(jwt);
            User user = authenticationService.getUserByEmail(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            List<LogisticsRequest> requests = logisticsRequestService.getRequestsForUser(user);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}
