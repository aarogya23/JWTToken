package com.project.JWTToken.repository;

import com.project.JWTToken.model.GroupMember;
import com.project.JWTToken.model.Group;
import com.project.JWTToken.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    List<GroupMember> findByGroupId(Long groupId);
    List<GroupMember> findByGroupIdAndApprovedTrue(Long groupId);
    Optional<GroupMember> findByGroupAndUser(Group group, User user);
    List<GroupMember> findByUserId(Integer userId);

    @Query("SELECT gm FROM GroupMember gm JOIN FETCH gm.group g JOIN FETCH g.createdBy WHERE gm.user.id = :userId")
    List<GroupMember> findByUserIdWithGroupFetched(@Param("userId") Integer userId);
}
