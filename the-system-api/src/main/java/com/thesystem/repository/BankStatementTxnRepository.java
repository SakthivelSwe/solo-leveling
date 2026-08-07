package com.thesystem.repository;

import com.thesystem.entity.BankStatementTxn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BankStatementTxnRepository extends JpaRepository<BankStatementTxn, Long> {
}
