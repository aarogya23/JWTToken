package com.project.JWTToken.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EsewaVerificationRequest {
    private Integer orderId;
    private String data;
}
