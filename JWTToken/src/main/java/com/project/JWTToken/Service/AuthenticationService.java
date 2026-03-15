package com.project.JWTToken.Service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.project.JWTToken.dtos.LoginUserDto;
import com.project.JWTToken.dtos.RegisterUserDto;
import com.project.JWTToken.model.User;
import com.project.JWTToken.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service    
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public User signup(RegisterUserDto input) {
        if (userRepository.findByEmail(input.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        var user = User.builder()
                .fullName(input.getFullName())
                .email(input.getEmail())
                .password(passwordEncoder.encode(input.getPassword()))
                .build();

        return userRepository.save(user);
    }

    public User authenticate(LoginUserDto input) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        input.getEmail(),
                        input.getPassword()
                )
        );

        return userRepository.findByEmail(input.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));
    }
}