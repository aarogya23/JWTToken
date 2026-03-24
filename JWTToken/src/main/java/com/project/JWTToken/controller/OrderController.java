package com.project.JWTToken.controller;

import com.project.JWTToken.Service.OrderService;
import com.project.JWTToken.dtos.OrderDto;
import com.project.JWTToken.model.OrderStatus;
import com.project.JWTToken.model.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/{productId}")
    public ResponseEntity<OrderDto> buyProduct(
            @PathVariable Integer productId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        OrderDto orderDto = orderService.buyProduct(productId, currentUser);
        return ResponseEntity.ok(orderDto);
    }

    @GetMapping("/purchases")
    public ResponseEntity<List<OrderDto>> getPurchases(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        List<OrderDto> orders = orderService.getBuyerOrders(currentUser);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/sales")
    public ResponseEntity<List<OrderDto>> getSales(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        List<OrderDto> orders = orderService.getSellerOrders(currentUser);
        return ResponseEntity.ok(orders);
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<OrderDto> updateOrderStatus(
            @PathVariable Integer orderId,
            @RequestParam OrderStatus status,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        OrderDto updatedOrder = orderService.updateOrderStatus(orderId, status, currentUser);
        return ResponseEntity.ok(updatedOrder);
    }
}
