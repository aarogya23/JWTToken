package com.project.JWTToken.dtos;

import lombok.Data;

@Data
public class ReviewMessageApprovalRequestDto {
    private Long requestId;
    private boolean approved;
    private String rejectionReason;
}
