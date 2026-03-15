package com.project.JWTToken.dtos;

import lombok.Builder;
import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Builder
@Accessors(chain = true)
public class LoginResponse {
    private String token;
    private long expiresIn;
}
