package com.project.JWTToken.controller;

import com.project.JWTToken.Service.StoryService;
import com.project.JWTToken.Service.JwtService;
import com.project.JWTToken.model.Story;
import com.project.JWTToken.model.User;
import com.project.JWTToken.dtos.StoryDto;
import com.project.JWTToken.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/stories")
@CrossOrigin(origins = "*")
public class StoryController {

    @Autowired
    private StoryService storyService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    private static final long MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

    /**
     * Upload a new story
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadStory(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption,
            @RequestHeader("Authorization") String token) {
        try {
            // Get current user from token
            String userEmail = getEmailFromToken(token);
            
            // Validate file size
            if (file.getSize() > MAX_FILE_SIZE) {
                return ResponseEntity.badRequest()
                        .body("File size exceeds 15MB limit");
            }

            // Convert file to Base64
            byte[] fileBytes = file.getBytes();
            String base64File = Base64.getEncoder().encodeToString(fileBytes);

            Integer userId = getUserIdFromEmail(userEmail);

            Story story = storyService.createStory(
                    userId,
                    base64File,
                    file.getContentType(),
                    caption != null ? caption : ""
            );

            return ResponseEntity.ok(convertToDto(story));

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error uploading file: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    /**
     * Get all active stories (not expired)
     */
    @GetMapping("/all")
    public ResponseEntity<?> getAllStories() {
        try {
            List<Story> stories = storyService.getAllActiveStories();
            List<StoryDto> storyDtos = stories.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(storyDtos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching stories: " + e.getMessage());
        }
    }

    /**
     * Get stories by specific user
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserStories(@PathVariable Integer userId) {
        try {
            List<Story> stories = storyService.getStoriesByUser(userId);
            List<StoryDto> storyDtos = stories.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(storyDtos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching user stories: " + e.getMessage());
        }
    }

    /**
     * Get story by ID
     */
    @GetMapping("/{storyId}")
    public ResponseEntity<?> getStory(@PathVariable Long storyId) {
        try {
            Optional<Story> story = storyService.getStoryById(storyId);
            if (story.isPresent()) {
                return ResponseEntity.ok(convertToDto(story.get()));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Story not found or expired");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching story: " + e.getMessage());
        }
    }

    /**
     * Delete story - only owner can delete
     */
    @DeleteMapping("/{storyId}")
    public ResponseEntity<?> deleteStory(
            @PathVariable Long storyId,
            @RequestHeader("Authorization") String token) {
        try {
            // Extract current user
            String userEmail = getEmailFromToken(token);
            
            Optional<Story> storyOpt = storyService.getStoryById(storyId);
            if (!storyOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Story not found");
            }
            
            Story story = storyOpt.get();
            
            // Check if current user is the owner
            if (!story.getUser().getEmail().equals(userEmail)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You can only delete your own stories");
            }
            
            storyService.deleteStory(storyId);
            return ResponseEntity.ok("Story deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting story: " + e.getMessage());
        }
    }

    /**
     * Delete expired stories manually (cleanup)
     */
    @DeleteMapping("/cleanup/expired")
    public ResponseEntity<?> deleteExpiredStories() {
        try {
            storyService.deleteExpiredStories();
            return ResponseEntity.ok("Expired stories deleted");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error cleaning up expired stories: " + e.getMessage());
        }
    }

    // Helper methods
    private StoryDto convertToDto(Story story) {
        return StoryDto.builder()
                .id(story.getId())
                .userId(story.getUser().getId())
                .userFullName(story.getUser().getFullName())
                .userEmail(story.getUser().getEmail())
                .userProfileImage(story.getUser().getProfileImage())
                .mediaUrl(story.getMediaUrl())
                .mediaType(story.getMediaType())
                .caption(story.getCaption())
                .createdAt(story.getCreatedAt())
                .isExpired(story.isExpired())
                .build();
    }

    private Integer getUserIdFromEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }

    private String getEmailFromToken(String token) {
        try {
            String jwt = token.replace("Bearer ", "");
            return jwtService.extractUsername(jwt);
        } catch (Exception e) {
            throw new RuntimeException("Invalid token");
        }
    }
}

