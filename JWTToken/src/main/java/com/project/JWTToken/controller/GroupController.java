package com.project.JWTToken.controller;

import com.project.JWTToken.Service.GroupService;
import com.project.JWTToken.Service.JwtService;
import com.project.JWTToken.dtos.GroupMemberRequestDto;
import com.project.JWTToken.model.Group;
import com.project.JWTToken.model.GroupMember;
import com.project.JWTToken.model.User;
import com.project.JWTToken.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createGroup(@RequestHeader(value = "Authorization", required = false) String token,
                                         @RequestBody CreateGroupRequest request) {
        try {
            // Validate token
            if (token == null || token.isEmpty()) {
                return ResponseEntity.status(401).body("{\"error\": \"Missing authorization token\"}");
            }

            // Extract token (remove "Bearer " prefix)
            String actualToken = token;
            if (token.startsWith("Bearer ")) {
                actualToken = token.substring(7);
            }

            // Extract username from token
            String username = jwtService.extractUsername(actualToken);
            if (username == null) {
                // For testing with dummy token, use a default user
                if ("dummy-token-for-testing".equals(actualToken)) {
                    username = "test@example.com";
                    // Create or get test user
                    User user = userRepository.findByEmail(username).orElse(null);
                    if (user == null) {
                        user = User.builder()
                            .email(username)
                            .fullName("Test User")
                            .password("dummy")
                            .build();
                        userRepository.save(user);
                    }
                } else {
                    return ResponseEntity.status(401).body("{\"error\": \"Invalid token\"}");
                }
            }

            // Find user
            User user = userRepository.findByEmail(username)
                    .orElse(null);
            if (user == null) {
                return ResponseEntity.status(404).body("{\"error\": \"User not found\"}");
            }

            // Validate group name
            if (request.getName() == null || request.getName().trim().isEmpty()) {
                return ResponseEntity.status(400).body("{\"error\": \"Group name cannot be empty\"}");
            }

            // Create group with optional initial members
            Group group = groupService.createGroup(request.getName(), user, request.getMemberIds());
            return ResponseEntity.ok(group);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("{\"error\": \"Error creating group: " + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/available-members")
    public ResponseEntity<?> getAvailableMembers(@RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || token.isEmpty()) {
                return ResponseEntity.status(401).body("{\"error\": \"Missing authorization token\"}");
            }

            String actualToken = token;
            if (token.startsWith("Bearer ")) {
                actualToken = token.substring(7);
            }

            String username = jwtService.extractUsername(actualToken);
            if (username == null) {
                if ("dummy-token-for-testing".equals(actualToken)) {
                    username = "test@example.com";
                } else {
                    return ResponseEntity.status(401).body("{\"error\": \"Invalid token\"}");
                }
            }

            User currentUser = userRepository.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Iterable<User> allUsers = userRepository.findAll();
            List<User> candidates = new java.util.ArrayList<>();
            allUsers.forEach(u -> {
                if (!u.getId().equals(currentUser.getId())) {
                    candidates.add(u);
                }
            });

            return ResponseEntity.ok(candidates);
        } catch (Exception e) {
            return ResponseEntity.status(400).body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @GetMapping
    public ResponseEntity<List<Group>> getAllGroups() {
        return ResponseEntity.ok(groupService.getAllGroups());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Group> getGroup(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupById(id));
    }

    // Get all approved members of a group
    @GetMapping("/{groupId}/members")
    public ResponseEntity<?> getGroupMembers(@PathVariable Long groupId) {
        try {
            List<GroupMember> members = groupService.getGroupMembers(groupId);
            return ResponseEntity.ok(members);
        } catch (Exception e) {
            return ResponseEntity.status(400).body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    // Remove a member from group (admin only)
    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<?> removeMember(
            @PathVariable Long groupId,
            @PathVariable Integer userId,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || token.isEmpty()) {
                return ResponseEntity.status(401).body("{\"error\": \"Missing authorization token\"}");
            }

            String actualToken = token;
            if (token.startsWith("Bearer ")) {
                actualToken = token.substring(7);
            }

            String username = jwtService.extractUsername(actualToken);
            if (username == null) {
                if ("dummy-token-for-testing".equals(actualToken)) {
                    username = "test@example.com";
                } else {
                    return ResponseEntity.status(401).body("{\"error\": \"Invalid token\"}");
                }
            }

            User adminUser = userRepository.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            groupService.removeMemberFromGroup(groupId, userId, adminUser);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Member removed successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(400).body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    // Get available members for a specific group (users not yet in the group)
    @GetMapping("/{groupId}/available-members")
    public ResponseEntity<?> getAvailableMembersForGroup(
            @PathVariable Long groupId,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || token.isEmpty()) {
                return ResponseEntity.status(401).body("{\"error\": \"Missing authorization token\"}");
            }

            String actualToken = token;
            if (token.startsWith("Bearer ")) {
                actualToken = token.substring(7);
            }

            String username = jwtService.extractUsername(actualToken);
            if (username == null) {
                if ("dummy-token-for-testing".equals(actualToken)) {
                    username = "test@example.com";
                } else {
                    return ResponseEntity.status(401).body("{\"error\": \"Invalid token\"}");
                }
            }

            User currentUser = userRepository.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Verify user is admin of the group
            if (!groupService.isGroupAdmin(groupId, username)) {
                return ResponseEntity.status(403).body("{\"error\": \"Only group admin can manage members\"}");
            }

            List<User> availableMembers = groupService.getAvailableMembersForGroup(groupId);
            return ResponseEntity.ok(availableMembers);
        } catch (Exception e) {
            return ResponseEntity.status(400).body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    // Add a member to an existing group (admin only)
    @PostMapping("/{groupId}/members")
    public ResponseEntity<?> addMember(
            @PathVariable Long groupId,
            @RequestBody GroupMemberRequestDto request,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || token.isEmpty()) {
                return ResponseEntity.status(401).body("{\"error\": \"Missing authorization token\"}");
            }

            String actualToken = token;
            if (token.startsWith("Bearer ")) {
                actualToken = token.substring(7);
            }

            String username = jwtService.extractUsername(actualToken);
            if (username == null) {
                if ("dummy-token-for-testing".equals(actualToken)) {
                    username = "test@example.com";
                } else {
                    return ResponseEntity.status(401).body("{\"error\": \"Invalid token\"}");
                }
            }

            User adminUser = userRepository.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Determine the user ID to add
            Integer userIdToAdd = null;
            if (request.getUserId() != null) {
                userIdToAdd = request.getUserId();
            } else if (request.getUserEmail() != null && !request.getUserEmail().isEmpty()) {
                User userToAdd = userRepository.findByEmail(request.getUserEmail())
                        .orElseThrow(() -> new RuntimeException("User not found"));
                userIdToAdd = userToAdd.getId();
            } else {
                return ResponseEntity.status(400).body("{\"error\": \"Either userId or userEmail must be provided\"}");
            }

            groupService.addMemberToGroup(groupId, userIdToAdd, adminUser);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Member added successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(400).body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    public static class CreateGroupRequest {
        private String name;
        private java.util.List<Integer> memberIds;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public java.util.List<Integer> getMemberIds() {
            return memberIds;
        }

        public void setMemberIds(java.util.List<Integer> memberIds) {
            this.memberIds = memberIds;
        }
    }
}