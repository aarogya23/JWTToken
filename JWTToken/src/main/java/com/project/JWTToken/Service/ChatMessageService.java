package com.project.JWTToken.Service;

import com.project.JWTToken.model.ChatMessage;
import com.project.JWTToken.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;

    public ChatMessage saveMessage(ChatMessage chatMessage, String email) {
        chatMessage.setSender(email != null ? email : "Anonymous");
        chatMessage.setTimestamp(java.time.LocalDateTime.now());
        return chatMessageRepository.save(chatMessage);
    }

    public List<ChatMessage> getAllMessages() {
        return chatMessageRepository.findByOrderByTimestampAsc();
    }
}