package com.project.JWTToken.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Enumerated(EnumType.STRING)
    private MessageType type;

    private String content;

    private String sender;

    // persisted as `group_id` in chat_messages (this column is NOT NULL in the current schema)
    @Column(name = "group_id", nullable = false)
    private Long room;
    private LocalDateTime timestamp;

    // File/Media related fields
    @Column(columnDefinition = "LONGTEXT")
    private String fileUrl;           // Base64 encoded file or URL
    
    private String fileName;          // Original file name
    
    private String fileType;          // MIME type (image/png, video/mp4, etc.)
    
    private Long fileSize;            // File size in bytes

    public enum MessageType {
        CHAT, JOIN, LEAVE
    }
}