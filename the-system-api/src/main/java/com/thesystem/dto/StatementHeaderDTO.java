package com.thesystem.dto;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class StatementHeaderDTO {
    private String accountHolder;
    private String customerNo;
    private String ifscCode;
    private String bankName;
    private String period;
    private Double openingBalance;
}
