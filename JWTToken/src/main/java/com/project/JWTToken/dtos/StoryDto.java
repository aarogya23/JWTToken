package com.project.JWTToken.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoryDto {
    private Long id;
    private Integer userId;
    private String userFullName;
    private String userEmail;
    private String userProfileImage;
    private String mediaUrl;
    private String mediaType;
    private String caption;
    private LocalDateTime createdAt;
    private Boolean isExpired;
}
