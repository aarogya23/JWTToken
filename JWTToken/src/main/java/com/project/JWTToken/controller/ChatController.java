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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Base64;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

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

    /**
     * Upload file and return Base64 encoded file data
     * POST /api/chat/upload
     * Supports up to 15MB files
     */
    @PostMapping("/api/chat/upload")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "File is empty"));
            }

            // Check file size (max 15MB)
            long maxFileSize = 15 * 1024 * 1024; // 15MB
            if (file.getSize() > maxFileSize) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "File size exceeds 15MB limit"));
            }

            // Convert file to Base64
            byte[] fileBytes = file.getBytes();
            String base64File = Base64.getEncoder().encodeToString(fileBytes);

            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("fileUrl", "data:" + file.getContentType() + ";base64," + base64File);
            response.put("fileName", file.getOriginalFilename());
            response.put("fileType", file.getContentType());
            response.put("fileSize", file.getSize());

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            System.err.println("Error uploading file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to upload file"));
        } catch (Exception e) {
            System.err.println("Unexpected error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Server error"));
        }
    }

    /**
     * Send a message with file attachment
     * POST /api/chat/sendWithAttachment
     */
    @PostMapping("/api/chat/sendWithAttachment")
    public ResponseEntity<Map<String, Object>> sendMessageWithAttachment(
            @RequestParam("groupId") Long groupId,
            @RequestParam("sender") String sender,
            @RequestParam("content") String content,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            ChatMessage message = new ChatMessage();
            message.setRoom(groupId);
            message.setSender(sender);
            message.setContent(content);
            message.setType(ChatMessage.MessageType.CHAT);
            message.setTimestamp(LocalDateTime.now());

            // Handle file attachment if present
            if (file != null && !file.isEmpty()) {
                // Check file size (max 15MB)
                long maxFileSize = 15 * 1024 * 1024; // 15MB
                if (file.getSize() > maxFileSize) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "File size exceeds 15MB limit"));
                }

                // Convert file to Base64
                byte[] fileBytes = file.getBytes();
                String base64File = Base64.getEncoder().encodeToString(fileBytes);

                message.setFileUrl(base64File);
                message.setFileName(file.getOriginalFilename());
                message.setFileType(file.getContentType());
                message.setFileSize(file.getSize());
            }

            // Save message
            ChatMessage savedMessage = chatMessageService.saveMessage(message, sender, groupId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", savedMessage);
            response.put("fileUrl", savedMessage.getFileUrl() != null ? 
                "data:" + savedMessage.getFileType() + ";base64," + savedMessage.getFileUrl() : null);

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            System.err.println("Error sending message with attachment: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to send message with attachment"));
        } catch (Exception e) {
            System.err.println("Unexpected error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Server error"));
        }
    }
}