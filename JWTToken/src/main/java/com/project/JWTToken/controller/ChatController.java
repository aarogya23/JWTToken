package com.project.JWTToken.controller;

import com.project.JWTToken.Service.ChatMessageService;
import com.project.JWTToken.Service.JwtService;
import com.project.JWTToken.model.ChatMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@Controller
@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatMessageService chatMessageService;
    private final JwtService jwtService;

    @MessageMapping("/chat.sendMessage/{groupId}")
    @SendTo("/topic/group/{groupId}")
    public ChatMessage sendMessage(@DestinationVariable Long groupId,
                                   @Payload ChatMessage chatMessage,
                                   SimpMessageHeaderAccessor headerAccessor) {
        try {
            // Try to get username from session
            String username = (String) headerAccessor.getSessionAttributes().get("username");
            
            // If not in session, try to extract from JWT or use sender from payload
            if (username == null && chatMessage.getSender() != null) {
                username = chatMessage.getSender();
            }
            
            if (username == null) {
                username = "Anonymous";
            }

            // Save message to database under the requested group
            return chatMessageService.saveMessage(chatMessage, username, groupId);
        } catch (Exception e) {
            e.printStackTrace();
            return chatMessage;
        }
    }

    @MessageMapping("/chat.addUser/{groupId}")
    @SendTo("/topic/group/{groupId}")
    public ChatMessage addUser(@DestinationVariable Long groupId,
                               @Payload ChatMessage chatMessage,
                               SimpMessageHeaderAccessor headerAccessor) {
        try {
            String username = (String) headerAccessor.getSessionAttributes().get("username");
            
            if (username == null && chatMessage.getSender() != null) {
                username = chatMessage.getSender();
            }
            
            if (username == null) {
                username = "Anonymous";
            }
            
            chatMessage.setType(ChatMessage.MessageType.JOIN);
            chatMessage.setTimestamp(LocalDateTime.now());

            // Save join message in this group
            return chatMessageService.saveMessage(chatMessage, username, groupId);
        } catch (Exception e) {
            e.printStackTrace();
            return chatMessage;
        }
    }

    @GetMapping("/api/chat/history")
    public List<ChatMessage> getChatHistory(@RequestHeader(value = "Authorization", required = false) String token,
                                            @RequestParam(value = "groupId", required = false, defaultValue = "1") Long groupId) {
        try {
            // Validate token if provided
            if (token != null && token.startsWith("Bearer ")) {
                String jwt = token.replace("Bearer ", "");
                String username = jwtService.extractUsername(jwt);
                if (username != null) {
                    return chatMessageService.getMessagesForGroup(groupId);
                }
            }
            // Return messages anyway for authenticated users
            return chatMessageService.getMessagesForGroup(groupId);
        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }
}