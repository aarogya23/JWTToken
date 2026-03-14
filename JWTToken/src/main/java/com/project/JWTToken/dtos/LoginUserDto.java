package com.project.JWTToken.dtos;

import lombok.Data;

@Data
public class LoginUserDto {
    private String email;
    private String password;
}