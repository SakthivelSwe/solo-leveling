package com.thesystem.dto;

import lombok.Data;

@Data
public class BankStatementRowDTO {
    private Integer srl;
    private String tranDate;
    private String particulars;
    private Double debit;
    private Double credit;
    private Double balance;
    private Boolean selected = true;
}
