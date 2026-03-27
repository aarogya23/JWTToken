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
public class CreatorPostDto {
    private Integer id;
    private Integer userId;
    private String ownerName;
    private String ownerImage;
    private String title;
    private String content;
    private String imageUrl;
    private LocalDateTime createdAt;
}
