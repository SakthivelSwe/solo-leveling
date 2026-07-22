package com.thesystem.dto;

import java.util.List;

public class RawDirectiveItemDTO {
    private String id;
    private String action;
    private List<String> tags;
    private String category;
    private String block;
    private Integer offsetMins;
    private String anchorKey;

    public RawDirectiveItemDTO() {}

    public RawDirectiveItemDTO(String id, String action, List<String> tags, String category, String block, Integer offsetMins, String anchorKey) {
        this.id = id;
        this.action = action;
        this.tags = tags;
        this.category = category;
        this.block = block;
        this.offsetMins = offsetMins;
        this.anchorKey = anchorKey;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getBlock() {
        return block;
    }

    public void setBlock(String block) {
        this.block = block;
    }

    public Integer getOffsetMins() {
        return offsetMins;
    }

    public void setOffsetMins(Integer offsetMins) {
        this.offsetMins = offsetMins;
    }

    public String getAnchorKey() {
        return anchorKey;
    }

    public void setAnchorKey(String anchorKey) {
        this.anchorKey = anchorKey;
    }
}
