package com.project.JWTToken.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "stories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Story {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "LONGTEXT")
    private String mediaUrl;           // Base64 encoded file or URL

    private String mediaType;          // MIME type (image/png, video/mp4, audio/mpeg, etc.)

    private String caption;            // Optional caption text

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Stories expire after 24 hours
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(createdAt.plusHours(24));
    }
}
