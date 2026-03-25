package com.project.JWTToken.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import lombok.RequiredArgsConstructor;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class LocationController {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Listen for incoming GPS coordinates from Couriers
     * Topic format: /app/delivery/{orderId}/location
     */
    @MessageMapping("/delivery/{orderId}/location")
    public void streamDriverLocation(@DestinationVariable String orderId, @Payload Map<String, Double> payload) {
        // Broadcast the live coordinates straight to any buyers or sellers subscribing to this order's transit topic
        messagingTemplate.convertAndSend("/topic/delivery/" + orderId, payload);
    }
}
