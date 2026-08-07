package com.thesystem.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "bank_statement_txns")
public class BankStatementTxn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "statement_id", nullable = false)
    @JsonIgnore
    private BankStatementRecord statement;

    private Integer srl;
    private String tranDate;
    
    @Column(length = 1000)
    private String particulars;
    
    private Double debit;
    private Double credit;
    private Double balance;
    
    private Boolean isImported = false;
    private String aiCategory;
    private String myLabel;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public BankStatementRecord getStatement() { return statement; }
    public void setStatement(BankStatementRecord statement) { this.statement = statement; }

    public Integer getSrl() { return srl; }
    public void setSrl(Integer srl) { this.srl = srl; }

    public String getTranDate() { return tranDate; }
    public void setTranDate(String tranDate) { this.tranDate = tranDate; }

    public String getParticulars() { return particulars; }
    public void setParticulars(String particulars) { this.particulars = particulars; }

    public Double getDebit() { return debit; }
    public void setDebit(Double debit) { this.debit = debit; }

    public Double getCredit() { return credit; }
    public void setCredit(Double credit) { this.credit = credit; }

    public Double getBalance() { return balance; }
    public void setBalance(Double balance) { this.balance = balance; }

    public Boolean getIsImported() { return isImported; }
    public void setIsImported(Boolean imported) { isImported = imported; }

    public String getAiCategory() { return aiCategory; }
    public void setAiCategory(String aiCategory) { this.aiCategory = aiCategory; }

    public String getMyLabel() { return myLabel; }
    public void setMyLabel(String myLabel) { this.myLabel = myLabel; }
}
