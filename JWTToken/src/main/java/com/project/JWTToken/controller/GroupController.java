package com.project.JWTToken.controller;

import com.project.JWTToken.Service.GroupService;
import com.project.JWTToken.Service.JwtService;
import com.project.JWTToken.model.Group;
import com.project.JWTToken.model.User;
import com.project.JWTToken.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<Group> createGroup(@RequestHeader("Authorization") String token,
                                             @RequestBody CreateGroupRequest request) {
        String username = jwtService.extractUsername(token.substring(7)); // Remove "Bearer "
        User user = userRepository.findByEmail(username).orElseThrow(() -> new RuntimeException("User not found"));
        Group group = groupService.createGroup(request.getName(), user);
        return ResponseEntity.ok(group);
    }

    @GetMapping
    public ResponseEntity<List<Group>> getAllGroups() {
        return ResponseEntity.ok(groupService.getAllGroups());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Group> getGroup(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupById(id));
    }

    public static class CreateGroupRequest {
        private String name;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }
}