package com.project.JWTToken.controller;

import com.project.JWTToken.model.User;
import com.project.JWTToken.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

@RestController
@RequestMapping("/api/retailers")
@RequiredArgsConstructor
public class RetailerController {

    private final UserRepository userRepository;

    @GetMapping
    public List<User> getRetailers() {
        LinkedHashMap<Integer, User> retailers = new LinkedHashMap<>();
        userRepository.findAll().forEach((user) -> {
            if ((user.getBusinessName() != null && !user.getBusinessName().isBlank())
                    || "B2B".equalsIgnoreCase(user.getMarketSegment())) {
                retailers.put(user.getId(), user);
            }
        });
        return new ArrayList<>(retailers.values());
    }
}
