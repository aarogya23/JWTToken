package com.project.JWTToken.controller;

import com.project.JWTToken.Service.OrderService;
import com.project.JWTToken.dtos.OrderDto;
import com.project.JWTToken.model.OrderStatus;
import com.project.JWTToken.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
public class DeliveryController {

    private final OrderService orderService;

    @GetMapping("/available")
    public ResponseEntity<?> getAvailableDeliveries(Authentication authentication) {
        User courier = (User) authentication.getPrincipal();
        if (!courier.isDeliveryPerson()) return ResponseEntity.status(403).body(Map.of("message", "Access Denied"));
        return ResponseEntity.ok(orderService.getAvailableDeliveries());
    }

    @GetMapping("/active")
    public ResponseEntity<?> getMyDeliveries(Authentication authentication) {
        User courier = (User) authentication.getPrincipal();
        if (!courier.isDeliveryPerson()) return ResponseEntity.status(403).body(Map.of("message", "Access Denied"));
        return ResponseEntity.ok(orderService.getMyDeliveries(courier));
    }

    @PostMapping("/{orderId}/accept")
    public ResponseEntity<?> acceptDelivery(
            @PathVariable("orderId") Integer orderId,
            Authentication authentication) {
        try {
            User courier = (User) authentication.getPrincipal();
            if (!courier.isDeliveryPerson()) return ResponseEntity.status(403).body(Map.of("message", "Access Denied"));
            return ResponseEntity.ok(orderService.acceptDelivery(orderId, courier));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Backend API Error: " + e.getMessage()));
        }
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateDeliveryStatus(
            @PathVariable("orderId") Integer orderId,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        try {
            User courier = (User) authentication.getPrincipal();
            if (!courier.isDeliveryPerson()) return ResponseEntity.status(403).body(Map.of("message", "Access Denied"));
            OrderStatus status = OrderStatus.valueOf(body.get("status"));
            return ResponseEntity.ok(orderService.updateDeliveryStatus(orderId, status, courier));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Backend API Error: " + e.getMessage()));
        }
    }
}
