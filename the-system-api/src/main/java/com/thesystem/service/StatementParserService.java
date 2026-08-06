package com.thesystem.service;

import com.thesystem.dto.BankStatementRowDTO;
import com.thesystem.dto.StatementHeaderDTO;
import com.thesystem.dto.StatementParseResponse;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.Loader;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class StatementParserService {

    public StatementParseResponse parseAxisBankPdf(MultipartFile file) throws Exception {
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String text = stripper.getText(document);
            return parsePdfText(text);
        }
    }

    private StatementParseResponse parsePdfText(String text) {
        StatementParseResponse response = new StatementParseResponse();
        StatementHeaderDTO header = new StatementHeaderDTO();
        header.setBankName("AXIS BANK");
        List<BankStatementRowDTO> rows = new ArrayList<>();

        String[] lines = text.split("\\r?\\n");
        
        boolean inTransactionSection = false;
        Double previousBalance = null;
        
        Pattern datePattern = Pattern.compile("^\\d{2}-\\d{2}-\\d{4}");
        Pattern amountBalBranchPattern = Pattern.compile("\\s+([\\d,]+\\.\\d{2})\\s+([\\d,]+\\.\\d{2})(?:\\s+\\d+)?$");
        
        StringBuilder currentTxnBuilder = new StringBuilder();
        String currentTxnDate = null;
        int srl = 1;

        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty()) continue;

            // Extract Header info
            if (line.contains("Name:") || line.contains("Joint Holder")) {
                // Usually Name is above Joint Holder, but it's fine
            }
            if (line.startsWith("Statement of Axis Account No")) {
                header.setPeriod(line);
                inTransactionSection = true;
                continue;
            }
            
            if (line.contains("OPENING BALANCE")) {
                Matcher m = Pattern.compile("([\\d,]+\\.\\d{2})").matcher(line);
                if (m.find()) {
                    String balStr = m.group(1).replace(",", "");
                    previousBalance = Double.parseDouble(balStr);
                    header.setOpeningBalance(previousBalance);
                }
                continue;
            }

            if (!inTransactionSection) continue;

            Matcher dateMatcher = datePattern.matcher(line);
            if (dateMatcher.find()) {
                // We found a new transaction date. Process the previous one if exists.
                if (currentTxnDate != null && currentTxnBuilder.length() > 0) {
                    BankStatementRowDTO row = processTransactionBlock(currentTxnDate, currentTxnBuilder.toString(), previousBalance, srl);
                    if (row != null) {
                        rows.add(row);
                        previousBalance = row.getBalance();
                        srl++;
                    }
                }
                
                // Start new transaction
                currentTxnDate = dateMatcher.group();
                String restOfLine = line.substring(currentTxnDate.length()).trim();
                currentTxnBuilder = new StringBuilder(restOfLine);
            } else if (currentTxnDate != null) {
                // Continuation of current transaction
                if (line.contains("TRANSACTION TOTAL") || line.contains("CLOSING BALANCE")) {
                    // End of statement reached. Process last transaction.
                    BankStatementRowDTO row = processTransactionBlock(currentTxnDate, currentTxnBuilder.toString(), previousBalance, srl);
                    if (row != null) {
                        rows.add(row);
                        previousBalance = row.getBalance();
                    }
                    currentTxnDate = null; // stop processing
                    inTransactionSection = false;
                } else {
                    currentTxnBuilder.append(" ").append(line);
                }
            }
        }
        
        // Handle case where file ends without footer
        if (currentTxnDate != null && currentTxnBuilder.length() > 0) {
            BankStatementRowDTO row = processTransactionBlock(currentTxnDate, currentTxnBuilder.toString(), previousBalance, srl);
            if (row != null) {
                rows.add(row);
            }
        }

        response.setHeader(header);
        response.setRows(rows);
        return response;
    }

    private BankStatementRowDTO processTransactionBlock(String date, String block, Double previousBalance, int srl) {
        BankStatementRowDTO row = new BankStatementRowDTO();
        row.setSrl(srl);
        row.setTranDate(date);
        
        // Look for amount and balance at the end
        Pattern pattern = Pattern.compile("\\s+([\\d,]+\\.\\d{2})\\s+([\\d,]+\\.\\d{2})(?:\\s+\\d+)?$");
        Matcher m = pattern.matcher(block);
        
        if (m.find()) {
            String amountStr = m.group(1).replace(",", "");
            String balanceStr = m.group(2).replace(",", "");
            
            Double amount = Double.parseDouble(amountStr);
            Double balance = Double.parseDouble(balanceStr);
            
            row.setBalance(balance);
            
            // Determine if debit or credit
            if (previousBalance != null) {
                if (balance > previousBalance) {
                    row.setCredit(amount);
                } else {
                    row.setDebit(amount);
                }
            } else {
                // If opening balance missing, fallback logic (not 100% reliable but better than nothing)
                // Defaulting to Debit if we can't tell, though we should always have opening balance.
                row.setDebit(amount);
            }
            
            // Particulars is everything before the match
            String particulars = block.substring(0, m.start()).trim();
            row.setParticulars(particulars);
            
            return row;
        }
        
        return null;
    }
}
