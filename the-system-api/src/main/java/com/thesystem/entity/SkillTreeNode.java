package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "skill_tree_nodes")
@Getter
@Setter
public class SkillTreeNode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "parent_skill_name", nullable = false)
    private String parentSkillName; // e.g. "Java + Spring Boot"

    @Column(name = "node_name", nullable = false)
    private String nodeName; // e.g. "Spring Boot", "Kafka"

    @Column(name = "node_key", nullable = false)
    private String nodeKey; // e.g. "java_kafka"

    @Column(nullable = false)
    private boolean unlocked = false;

    @Column(name = "progress_pct", nullable = false)
    private int progressPct = 0;

    @Column(name = "prerequisite_node_key")
    private String prerequisiteNodeKey;

    @Column(name = "xp_invested", nullable = false)
    private int xpInvested = 0;
}
