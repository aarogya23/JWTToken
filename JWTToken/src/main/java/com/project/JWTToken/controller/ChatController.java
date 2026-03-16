package com.project.JWTToken.controller;

import com.project.JWTToken.Service.ChatMessageService;
import com.project.JWTToken.Service.JwtService;
import com.project.JWTToken.model.ChatMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@Controller
@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatMessageService chatMessageService;
    private final JwtService jwtService;

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        String username = (String) headerAccessor.getSessionAttributes().get("username");

        // Save message to database
        return chatMessageService.saveMessage(chatMessage, username);
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(@Payload ChatMessage chatMessage,
                              SimpMessageHeaderAccessor headerAccessor) {
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        chatMessage.setType(ChatMessage.MessageType.JOIN);

        // Save join message
        return chatMessageService.saveMessage(chatMessage, username);
    }

    @GetMapping("/api/chat/history")
    public List<ChatMessage> getChatHistory(@RequestHeader("Authorization") String token) {
        // Validate token
        if (token != null && token.startsWith("Bearer ")) {
            String jwt = token.replace("Bearer ", "");
            String username = jwtService.extractUsername(jwt);
            if (username != null) {
                return chatMessageService.getAllMessages();
            }
        }
        return List.of();
    }
}