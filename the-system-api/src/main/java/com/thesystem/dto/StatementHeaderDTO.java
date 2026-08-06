package com.thesystem.dto;

import lombok.Data;

@Data
public class StatementHeaderDTO {
    private String accountHolder;
    private String customerNo;
    private String ifscCode;
    private String bankName;
    private String period;
    private Double openingBalance;
}
