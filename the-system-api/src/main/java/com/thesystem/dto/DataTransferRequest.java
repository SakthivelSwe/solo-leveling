package com.thesystem.dto;

import java.util.List;

public class DataTransferRequest {
    private String targetEmail;
    private List<String> modules;
    private String transferMode; // COPY, MOVE

    public String getTargetEmail() { return targetEmail; }
    public void setTargetEmail(String targetEmail) { this.targetEmail = targetEmail; }

    public List<String> getModules() { return modules; }
    public void setModules(List<String> modules) { this.modules = modules; }

    public String getTransferMode() { return transferMode; }
    public void setTransferMode(String transferMode) { this.transferMode = transferMode; }
}
