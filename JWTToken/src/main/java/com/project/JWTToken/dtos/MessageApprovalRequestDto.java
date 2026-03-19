package com.project.JWTToken.dtos;

import lombok.Data;

@Data
public class MessageApprovalRequestDto {
    private Long groupId;
    private String messageContent;
}
