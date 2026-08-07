package com.thesystem.dto;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class BankStatementRowDTO {
    private Integer srl;
    private String tranDate;
    private String particulars;
    private Double debit;
    private Double credit;
    private Double balance;
    private Boolean selected = true;
}
