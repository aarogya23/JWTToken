package com.project.JWTToken.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EsewaInitiationResponse {
    private Integer orderId;
    private String action;
    private Map<String, String> fields;
}
