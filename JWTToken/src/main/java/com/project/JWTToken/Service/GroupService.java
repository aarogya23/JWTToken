package com.project.JWTToken.Service;

import com.project.JWTToken.model.Group;
import com.project.JWTToken.model.User;
import com.project.JWTToken.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;

    public Group createGroup(String name, User createdBy) {
        Group group = Group.builder()
                .name(name)
                .createdBy(createdBy)
                .createdAt(LocalDateTime.now())
                .build();
        return groupRepository.save(group);
    }

    public List<Group> getAllGroups() {
        return groupRepository.findAllByOrderByCreatedAtDesc();
    }

    public Group getGroupById(Long id) {
        return groupRepository.findById(id).orElseThrow(() -> new RuntimeException("Group not found"));
    }
}