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
            log.debug("PDF first 500 chars:\n{}", text.substring(0, Math.min(500, text.length())));
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

        // Flexible date patterns: DD-MM-YYYY or DD/MM/YYYY
        Pattern dateLinePattern = Pattern.compile("^(\\d{2}[-/]\\d{2}[-/]\\d{4})(.*)");
        // Two amounts at end of line: amount balance [optional branch code]
        Pattern amountPattern = Pattern.compile("([\\d,]+\\.\\d{2})\\s+([\\d,]+\\.\\d{2})(?:\\s+\\d+)?\\s*$");

        StringBuilder currentTxnBuilder = new StringBuilder();
        String currentTxnDate = null;
        int srl = 1;

        for (String rawLine : lines) {
            String line = rawLine.trim();
            if (line.isEmpty()) continue;

            // ── Header extraction ────────────────────────────────────────────
            if (line.contains("Account No") || line.contains("Account Number")) {
                header.setPeriod(line);
                inTransactionSection = true;
            }
            if (line.startsWith("Statement of Axis Account No")) {
                header.setPeriod(line);
                inTransactionSection = true;
            }
            // Name line
            if (line.toLowerCase().startsWith("name") && line.contains(":")) {
                String[] parts = line.split(":", 2);
                if (parts.length > 1 && !parts[1].isBlank()) {
                    header.setAccountHolder(parts[1].trim());
                }
            }
            // OPENING BALANCE
            if (line.toUpperCase().contains("OPENING BALANCE")) {
                Matcher m = Pattern.compile("([\\d,]+\\.\\d{2})").matcher(line);
                if (m.find()) {
                    try {
                        previousBalance = Double.parseDouble(m.group(1).replace(",", ""));
                        header.setOpeningBalance(previousBalance);
                    } catch (NumberFormatException ignored) {}
                }
                inTransactionSection = true; // always enable after opening balance
                continue;
            }
            // Enable parsing from first date found even if header not detected
            Matcher firstCheck = dateLinePattern.matcher(line);
            if (firstCheck.find() && !inTransactionSection) {
                log.info("Enabling transaction parsing from first date line: {}", line);
                inTransactionSection = true;
            }

            // Skip column header rows
            String upper = line.toUpperCase();
            if (upper.contains("DATE") && upper.contains("PARTICULARS") && upper.contains("BALANCE")) continue;
            if (upper.contains("TRANSACTION") && upper.contains("TOTAL")) {
                // flush last
                if (currentTxnDate != null && currentTxnBuilder.length() > 0) {
                    BankStatementRowDTO row = processBlock(currentTxnDate, currentTxnBuilder.toString(), previousBalance, srl);
                    if (row != null) { rows.add(row); }
                }
                break;
            }
            if (upper.contains("CLOSING BALANCE")) {
                if (currentTxnDate != null && currentTxnBuilder.length() > 0) {
                    BankStatementRowDTO row = processBlock(currentTxnDate, currentTxnBuilder.toString(), previousBalance, srl);
                    if (row != null) { rows.add(row); }
                }
                break;
            }

            if (!inTransactionSection) continue;

            // ── Transaction parsing ────────────────────────────────────────────
            Matcher dateMatcher = dateLinePattern.matcher(line);
            if (dateMatcher.find()) {
                // Flush previous transaction
                if (currentTxnDate != null && currentTxnBuilder.length() > 0) {
                    BankStatementRowDTO row = processBlock(currentTxnDate, currentTxnBuilder.toString(), previousBalance, srl);
                    if (row != null) {
                        rows.add(row);
                        previousBalance = row.getBalance();
                        srl++;
                    }
                }
                // Start new transaction
                currentTxnDate = dateMatcher.group(1);
                String rest = dateMatcher.group(2).trim();
                currentTxnBuilder = new StringBuilder(rest);
            } else if (currentTxnDate != null) {
                // Continuation line
                currentTxnBuilder.append(" ").append(line);
            }
        }

        // Flush last transaction
        if (currentTxnDate != null && currentTxnBuilder.length() > 0) {
            BankStatementRowDTO row = processBlock(currentTxnDate, currentTxnBuilder.toString(), previousBalance, srl);
            if (row != null) rows.add(row);
        }

        log.info("Parsed {} transactions from PDF", rows.size());
        response.setHeader(header);
        response.setRows(rows);
        return response;
    }

    private BankStatementRowDTO processBlock(String date, String block, Double prevBalance, int srl) {
        // Find two consecutive amounts at the end of block (amount + balance)
        // Also handles lines where only one amount appears (like interest postings)
        Pattern twoAmounts = Pattern.compile("\\s+([\\d,]+\\.\\d{2})\\s+([\\d,]+\\.\\d{2})(?:\\s+\\w+)?\\s*$");
        Matcher m = twoAmounts.matcher(block);

        if (!m.find()) {
            // Try looking for single amount + balance pattern differently
            log.debug("No amount match in block for date {}: {}", date, block.substring(0, Math.min(100, block.length())));
            return null;
        }

        String amountStr  = m.group(1).replace(",", "");
        String balanceStr = m.group(2).replace(",", "");

        double amount, balance;
        try {
            amount  = Double.parseDouble(amountStr);
            balance = Double.parseDouble(balanceStr);
        } catch (NumberFormatException e) {
            log.warn("Failed to parse amounts from: {} | {}", amountStr, balanceStr);
            return null;
        }

        BankStatementRowDTO row = new BankStatementRowDTO();
        row.setSrl(srl);
        row.setTranDate(date);
        row.setBalance(balance);

        // Determine debit or credit using balance comparison
        if (prevBalance != null) {
            if (balance >= prevBalance - 0.01) {
                row.setCredit(amount);
            } else {
                row.setDebit(amount);
            }
        } else {
            // No opening balance available, default to debit
            row.setDebit(amount);
        }

        // Particulars = everything before the two amounts
        String particulars = block.substring(0, m.start()).trim();
        // Clean up: remove reference numbers at beginning (Axis Bank includes them)
        particulars = particulars.replaceAll("^\\d{6,}\\s*", "").trim();
        if (particulars.isEmpty()) particulars = "UPI/NEFT Transaction";
        row.setParticulars(particulars);

        return row;
    }
}
