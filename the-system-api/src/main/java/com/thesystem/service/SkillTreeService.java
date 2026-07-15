package com.thesystem.service;

import com.thesystem.entity.SkillTreeNode;
import com.thesystem.repository.SkillTreeNodeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SkillTreeService {

    private final SkillTreeNodeRepository treeRepo;

    public SkillTreeService(SkillTreeNodeRepository treeRepo) {
        this.treeRepo = treeRepo;
    }

    public List<SkillTreeNode> getNodes(Long playerId) {
        List<SkillTreeNode> nodes = treeRepo.findByPlayerId(playerId);
        if (nodes.isEmpty()) {
            nodes = seedDefaultNodes(playerId);
        }
        return nodes;
    }

    private List<SkillTreeNode> seedDefaultNodes(Long playerId) {
        List<SkillTreeNode> seed = List.of(
            buildNode(playerId, "Java + Spring Boot", "Spring Boot", "java_spring", null),
            buildNode(playerId, "Java + Spring Boot", "Kafka", "java_kafka", "java_spring"),
            buildNode(playerId, "Java + Spring Boot", "Redis", "java_redis", "java_spring"),
            buildNode(playerId, "Java + Spring Boot", "Docker", "java_docker", null),
            buildNode(playerId, "Java + Spring Boot", "System Design", "java_sys_design", "java_kafka"),
            buildNode(playerId, "Java + Spring Boot", "AWS", "java_aws", "java_docker"),
            buildNode(playerId, "Java + Spring Boot", "Kubernetes", "java_k8s", "java_docker")
        );
        return treeRepo.saveAll(seed);
    }

    private SkillTreeNode buildNode(Long playerId, String parent, String name, String key, String req) {
        SkillTreeNode n = new SkillTreeNode();
        n.setPlayerId(playerId);
        n.setParentSkillName(parent);
        n.setNodeName(name);
        n.setNodeKey(key);
        n.setPrerequisiteNodeKey(req);
        n.setUnlocked(req == null); // Root nodes start unlocked
        n.setProgressPct(0);
        n.setXpInvested(0);
        return n;
    }
}
