package com.thesystem.dto;

public class AiDirectiveRequestDTO {
    private String wakeTime;
    private String officeStart;
    private String officeEnd;
    private String sleepTime;

    public AiDirectiveRequestDTO() {}

    public AiDirectiveRequestDTO(String wakeTime, String officeStart, String officeEnd, String sleepTime) {
        this.wakeTime = wakeTime;
        this.officeStart = officeStart;
        this.officeEnd = officeEnd;
        this.sleepTime = sleepTime;
    }

    public String getWakeTime() {
        return wakeTime;
    }

    public void setWakeTime(String wakeTime) {
        this.wakeTime = wakeTime;
    }

    public String getOfficeStart() {
        return officeStart;
    }

    public void setOfficeStart(String officeStart) {
        this.officeStart = officeStart;
    }

    public String getOfficeEnd() {
        return officeEnd;
    }

    public void setOfficeEnd(String officeEnd) {
        this.officeEnd = officeEnd;
    }

    public String getSleepTime() {
        return sleepTime;
    }

    public void setSleepTime(String sleepTime) {
        this.sleepTime = sleepTime;
    }
}
