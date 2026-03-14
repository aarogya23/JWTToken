package com.project.JWTToken.dtos;

import lombok.Data;

@Data
public class RegisterUserDto {
    private String fullName;
    private String email;
    private String password;
}