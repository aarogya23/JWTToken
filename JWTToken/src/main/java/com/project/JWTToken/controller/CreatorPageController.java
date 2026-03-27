package com.project.JWTToken.controller;

import com.project.JWTToken.dtos.CreatorPageDto;
import com.project.JWTToken.dtos.CreatorPostDto;
import com.project.JWTToken.model.CreatorPost;
import com.project.JWTToken.model.Product;
import com.project.JWTToken.model.User;
import com.project.JWTToken.repository.CreatorPostRepository;
import com.project.JWTToken.repository.ProductRepository;
import com.project.JWTToken.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/creator-pages")
@RequiredArgsConstructor
public class CreatorPageController {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CreatorPostRepository creatorPostRepository;

    @GetMapping("/{userId}")
    public ResponseEntity<CreatorPageDto> getCreatorPage(@PathVariable("userId") Integer userId) {
        User owner = userRepository.findById(userId).orElse(null);
        if (owner == null) {
            return ResponseEntity.notFound().build();
        }

        List<Product> products = productRepository.findByUserAndIsSoldFalse(owner);
        List<CreatorPostDto> posts = creatorPostRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapPost)
                .toList();

        return ResponseEntity.ok(
                CreatorPageDto.builder()
                        .ownerId(owner.getId())
                        .fullName(owner.getFullName())
                        .businessName(owner.getBusinessName())
                        .bio(owner.getBio())
                        .location(owner.getLocation())
                        .profileImage(owner.getProfileImage())
                        .marketSegment(owner.getMarketSegment())
                        .logisticsSupport(owner.getLogisticsSupport())
                        .products(products)
                        .posts(posts)
                        .build()
        );
    }

    @PostMapping("/{userId}/posts")
    public ResponseEntity<?> createPost(
            @PathVariable("userId") Integer userId,
            @RequestBody CreatorPostDto dto,
            Authentication authentication
    ) {
        User currentUser = (User) authentication.getPrincipal();
        if (!currentUser.getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "You can only post on your own page"));
        }

        User owner = userRepository.findById(userId).orElse(null);
        if (owner == null) {
            return ResponseEntity.notFound().build();
        }

        if (dto.getTitle() == null || dto.getTitle().isBlank() || dto.getContent() == null || dto.getContent().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Title and content are required"));
        }

        CreatorPost saved = creatorPostRepository.save(
                CreatorPost.builder()
                        .user(owner)
                        .title(dto.getTitle().trim())
                        .content(dto.getContent().trim())
                        .imageUrl(dto.getImageUrl())
                        .build()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(mapPost(saved));
    }

    @DeleteMapping("/{userId}/posts/{postId}")
    public ResponseEntity<?> deletePost(
            @PathVariable("userId") Integer userId,
            @PathVariable("postId") Integer postId,
            Authentication authentication
    ) {
        User currentUser = (User) authentication.getPrincipal();
        if (!currentUser.getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "You can only manage your own page"));
        }

        CreatorPost post = creatorPostRepository.findById(postId).orElse(null);
        if (post == null || post.getUser() == null || !post.getUser().getId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }

        creatorPostRepository.delete(post);
        return ResponseEntity.noContent().build();
    }

    private CreatorPostDto mapPost(CreatorPost post) {
        return CreatorPostDto.builder()
                .id(post.getId())
                .userId(post.getUser().getId())
                .ownerName(post.getUser().getFullName() != null && !post.getUser().getFullName().isBlank() ? post.getUser().getFullName() : post.getUser().getEmail())
                .ownerImage(post.getUser().getProfileImage())
                .title(post.getTitle())
                .content(post.getContent())
                .imageUrl(post.getImageUrl())
                .createdAt(post.getCreatedAt())
                .build();
    }
}
