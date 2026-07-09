package com.example.Innovation_backend.project;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;

/**
 * Generates official ZSA project IDs in the format {@code ZSA-INV-{YEAR}-{sequence}}
 * — e.g. {@code ZSA-INV-2026-001}. Sequence resets each calendar year and is
 * based on the count of already-APPROVED projects for that year.
 *
 * The generation is wrapped in a separate transaction (REQUIRES_NEW) so the
 * count reflects committed data, not the in-flight batch.
 */
@Service
@RequiredArgsConstructor
public class ZsaIdGenerator {

    private final ProjectRepository projectRepo;

    private static final String PREFIX_FORMAT = "ZSA-INV-%d-";
    private static final int PAD_WIDTH = 3;

    /**
     * @return next free ZSA ID for the current year, e.g. "ZSA-INV-2026-001"
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public String nextForCurrentYear() {
        int year = Year.now().getValue();
        String prefix = String.format(PREFIX_FORMAT, year);
        long count = projectRepo.countByZsaIdStartingWith(prefix);
        long sequence = count + 1;
        return prefix + String.format("%0" + PAD_WIDTH + "d", sequence);
    }
}