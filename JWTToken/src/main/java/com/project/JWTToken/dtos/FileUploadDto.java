package com.project.JWTToken.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadDto {
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String fileUrl;           // Base64 encoded file
}
