package com.thesystem.dto;

import lombok.Data;
import java.util.List;

@Data
public class StatementParseResponse {
    private StatementHeaderDTO header;
    private List<BankStatementRowDTO> rows;
}
