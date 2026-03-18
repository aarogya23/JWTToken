package com.project.JWTToken.Service;

import com.project.JWTToken.model.Story;
import com.project.JWTToken.model.User;
import com.project.JWTToken.repository.StoryRepository;
import com.project.JWTToken.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class StoryService {

    @Autowired
    private StoryRepository storyRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Create a new story
     */
    public Story createStory(Integer userId, String mediaUrl, String mediaType, String caption) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Story story = Story.builder()
                .user(user)
                .mediaUrl(mediaUrl)
                .mediaType(mediaType)
                .caption(caption)
                .build();

        return storyRepository.save(story);
    }

    /**
     * Get all active stories (not older than 24 hours)
     */
    public List<Story> getAllActiveStories() {
        LocalDateTime twentyFourHoursAgo = LocalDateTime.now().minusHours(24);
        List<Story> stories = storyRepository.findRecentStories(twentyFourHoursAgo);
        
        // Filter out expired stories and limit to 100
        return stories.stream()
                .filter(story -> !story.isExpired())
                .limit(100)
                .collect(Collectors.toList());
    }

    /**
     * Get stories by specific user
     */
    public List<Story> getStoriesByUser(Integer userId) {
        List<Story> stories = storyRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        return stories.stream()
                .filter(story -> !story.isExpired())
                .collect(Collectors.toList());
    }

    /**
     * Get story by ID
     */
    public Optional<Story> getStoryById(Long storyId) {
        Optional<Story> story = storyRepository.findById(storyId);
        if (story.isPresent() && !story.get().isExpired()) {
            return story;
        }
        return Optional.empty();
    }

    /**
     * Delete story by ID
     */
    public void deleteStory(Long storyId) {
        storyRepository.deleteById(storyId);
    }

    /**
     * Delete expired stories (older than 24 hours)
     */
    public void deleteExpiredStories() {
        LocalDateTime expirationTime = LocalDateTime.now().minusHours(24);
        storyRepository.deleteByCreatedAtBefore(expirationTime);
    }

    /**
     * Get user's stories
     */
    public List<Story> getUserStories(Integer userId) {
        return getStoriesByUser(userId);
    }
}
