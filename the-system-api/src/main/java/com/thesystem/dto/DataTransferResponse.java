package com.thesystem.dto;

import java.util.Map;

public class DataTransferResponse {
    private boolean success;
    private String message;
    private Map<String, Integer> transferStats;

    public DataTransferResponse() {}

    public DataTransferResponse(boolean success, String message, Map<String, Integer> transferStats) {
        this.success = success;
        this.message = message;
        this.transferStats = transferStats;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Map<String, Integer> getTransferStats() { return transferStats; }
    public void setTransferStats(Map<String, Integer> transferStats) { this.transferStats = transferStats; }
}
