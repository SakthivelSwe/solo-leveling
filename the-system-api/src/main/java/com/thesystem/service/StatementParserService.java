package com.thesystem.service;

import com.thesystem.dto.BankStatementRowDTO;
import com.thesystem.dto.StatementHeaderDTO;
import com.thesystem.dto.StatementParseResponse;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.Loader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class StatementParserService {

    private static final Logger log = LoggerFactory.getLogger(StatementParserService.class);

    public StatementParseResponse parseAxisBankPdf(MultipartFile file) throws Exception {
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String text = stripper.getText(document);
            log.info("PDF extracted text length: {}", text.length());
            return parsePdfText(text);
        }
    }

    private StatementParseResponse parsePdfText(String text) {
        StatementParseResponse response = new StatementParseResponse();
        StatementHeaderDTO header = new StatementHeaderDTO();
        List<BankStatementRowDTO> rows = new ArrayList<>();

        String[] lines = text.split("\\r?\\n");

        boolean inTransactionSection = false;
        Double previousBalance = null;

        // Expanded Date Pattern: 
        // DD/MM/YYYY, DD-MM-YYYY, DD-MMM-YYYY, YYYY-MM-DD, DD MMM YYYY
        Pattern dateLinePattern = Pattern.compile("^(\\d{2}[-/\\s]\\d{2}[-/\\s]\\d{2,4}|\\d{2}[-/\\s][A-Za-z]{3}[-/\\s]\\d{2,4}|\\d{4}[-/]\\d{2}[-/]\\d{2})(.*)");
        
        StringBuilder currentTxnBuilder = new StringBuilder();
        String currentTxnDate = null;
        int srl = 1;
        String detectedBank = "UNKNOWN BANK";

        for (String rawLine : lines) {
            String line = rawLine.trim();
            if (line.isEmpty()) continue;
            
            String upper = line.toUpperCase();

            // ── Heuristic Bank Detection ───────────────────────────────────
            if (detectedBank.equals("UNKNOWN BANK")) {
                if (upper.contains("AXIS BANK") || upper.contains("AXIS ACCOUNT")) detectedBank = "AXIS BANK";
                else if (upper.contains("HDFC BANK")) detectedBank = "HDFC BANK";
                else if (upper.contains("STATE BANK OF INDIA") || upper.contains("SBI")) detectedBank = "SBI";
                else if (upper.contains("ICICI BANK")) detectedBank = "ICICI BANK";
                else if (upper.contains("KOTAK MAHINDRA") || upper.contains("KOTAK BANK")) detectedBank = "KOTAK BANK";
                else if (upper.contains("YES BANK")) detectedBank = "YES BANK";
            }

            // ── Header extraction ────────────────────────────────────────────
            if (upper.contains("ACCOUNT NO") || upper.contains("ACCOUNT NUMBER") || upper.contains("A/C NO")) {
                if (header.getPeriod() == null) header.setPeriod(line);
            }
            if (upper.startsWith("NAME") && line.contains(":")) {
                String[] parts = line.split(":", 2);
                if (parts.length > 1 && !parts[1].isBlank()) header.setAccountHolder(parts[1].trim());
            }
            
            // OPENING BALANCE
            if (upper.contains("OPENING BALANCE") || upper.contains("B/F") || upper.contains("BALANCE BROUGHT FORWARD")) {
                Matcher m = Pattern.compile("([\\d,]+\\.\\d{2})").matcher(line);
                if (m.find()) {
                    try {
                        previousBalance = Double.parseDouble(m.group(1).replace(",", ""));
                        header.setOpeningBalance(previousBalance);
                    } catch (NumberFormatException ignored) {}
                }
                inTransactionSection = true; // start looking for transactions
                continue;
            }

            // Fallback trigger if opening balance is missing
            Matcher firstCheck = dateLinePattern.matcher(line);
            if (firstCheck.find() && !inTransactionSection) {
                inTransactionSection = true;
            }

            // End triggers
            if (upper.contains("TRANSACTION TOTAL") || upper.contains("CLOSING BALANCE") || upper.contains("C/F") || upper.contains("TOTAL DEBITS")) {
                if (currentTxnDate != null && currentTxnBuilder.length() > 0) {
                    BankStatementRowDTO row = processHeuristicBlock(currentTxnDate, currentTxnBuilder.toString(), previousBalance, srl);
                    if (row != null) {
                        rows.add(row);
                        previousBalance = row.getBalance();
                    }
                }
                break;
            }

            // Ignore table headers
            if (upper.contains("DATE") && upper.contains("PARTICULARS") && (upper.contains("BALANCE") || upper.contains("AMOUNT"))) continue;

            if (!inTransactionSection) continue;

            // ── Transaction parsing ────────────────────────────────────────────
            Matcher dateMatcher = dateLinePattern.matcher(line);
            if (dateMatcher.find()) {
                // Flush previous transaction
                if (currentTxnDate != null && currentTxnBuilder.length() > 0) {
                    BankStatementRowDTO row = processHeuristicBlock(currentTxnDate, currentTxnBuilder.toString(), previousBalance, srl);
                    if (row != null) {
                        rows.add(row);
                        previousBalance = row.getBalance();
                        srl++;
                    }
                }
                // Start new transaction
                currentTxnDate = dateMatcher.group(1).trim();
                String rest = dateMatcher.group(2).trim();
                currentTxnBuilder = new StringBuilder(rest);
            } else if (currentTxnDate != null) {
                // Continuation line
                currentTxnBuilder.append(" ").append(line);
            }
        }

        // Flush last transaction
        if (currentTxnDate != null && currentTxnBuilder.length() > 0) {
            BankStatementRowDTO row = processHeuristicBlock(currentTxnDate, currentTxnBuilder.toString(), previousBalance, srl);
            if (row != null) rows.add(row);
        }

        header.setBankName(detectedBank);
        response.setHeader(header);
        response.setRows(rows);
        return response;
    }

    private BankStatementRowDTO processHeuristicBlock(String date, String block, Double prevBalance, int srl) {
        // Extract all amounts formatted like XX,XXX.XX or XXX.XX from the string
        Pattern amountPattern = Pattern.compile("(?<=\\s|^)([\\d,]+\\.\\d{2})(?=\\s|$)");
        Matcher m = amountPattern.matcher(block);
        
        List<Double> amounts = new ArrayList<>();
        List<Integer> matchStarts = new ArrayList<>();
        
        while (m.find()) {
            try {
                amounts.add(Double.parseDouble(m.group(1).replace(",", "")));
                matchStarts.add(m.start());
            } catch (Exception ignored) {}
        }
        
        if (amounts.isEmpty()) {
            // Fallback: Check if it's an amount like XXXX (no decimals), very rare in bank statements but possible
            return null;
        }

        BankStatementRowDTO row = new BankStatementRowDTO();
        row.setSrl(srl);
        row.setTranDate(date);
        
        Double debit = null;
        Double credit = null;
        Double balance = null;
        int firstAmountIndex = matchStarts.get(0); // cut particulars here

        // Heuristic Resolution
        int count = amounts.size();
        if (count >= 3) {
            // [Amount1, Amount2, Balance] 
            double a1 = amounts.get(count - 3);
            double a2 = amounts.get(count - 2);
            double a3 = amounts.get(count - 1);
            
            balance = a3;
            if (prevBalance != null) {
                double diff = balance - prevBalance;
                if (diff > 0.01) credit = Math.abs(diff);
                else if (diff < -0.01) debit = Math.abs(diff);
                else {
                    // diff is 0, weird bank entry
                    if (a1 > 0) debit = a1; else credit = a2;
                }
            } else {
                if (a1 > 0) debit = a1; else credit = a2;
            }
            
        } else if (count == 2) {
            // [Amount, Balance] 
            double a1 = amounts.get(count - 2);
            double a2 = amounts.get(count - 1);
            
            balance = a2;
            
            if (prevBalance != null) {
                double diff = balance - prevBalance;
                if (diff > 0.01) credit = Math.abs(diff);
                else if (diff < -0.01) debit = Math.abs(diff);
                else {
                    // if diff is 0 (like 0 charge), fallback to amount
                    debit = a1;
                }
            } else {
                // blind guess
                debit = a1;
            }
        } else if (count == 1) {
            // Only one amount found. Usually an Amount (balance missing on this line).
            double a1 = amounts.get(0);
            if (prevBalance != null) {
                debit = a1;
                balance = prevBalance - debit;
            } else {
                debit = a1;
                balance = 0.0;
            }
        }

        row.setDebit(debit);
        row.setCredit(credit);
        row.setBalance(balance);

        // Particulars is everything before the first amount
        String particulars = block.substring(0, firstAmountIndex).trim();
        // Remove common reference numbers and bank garbage at the beginning
        particulars = particulars.replaceAll("^\\d{6,}\\s*", "").trim();
        if (particulars.isEmpty()) particulars = "Transaction";
        row.setParticulars(particulars);

        return row;
    }
}
