package com.thesystem.repository;

import com.thesystem.entity.SkillTreeNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillTreeNodeRepository extends JpaRepository<SkillTreeNode, Long> {
    List<SkillTreeNode> findByPlayerId(Long playerId);
    List<SkillTreeNode> findByPlayerIdAndParentSkillName(Long playerId, String parentSkillName);
    SkillTreeNode findByPlayerIdAndNodeKey(Long playerId, String nodeKey);
}
