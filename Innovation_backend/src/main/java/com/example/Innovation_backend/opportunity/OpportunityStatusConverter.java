package com.example.Innovation_backend.opportunity;

import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

/**
 * Spring converter to bind {@code @RequestParam("status") OpportunityStatus}
 * from query strings (e.g. {@code GET /api/opportunities?status=open}).
 * Accepts both lowercase ("open") and uppercase ("OPEN").
 */
@Component
public class OpportunityStatusConverter implements Converter<String, OpportunityStatus> {
    @Override
    public OpportunityStatus convert(String source) {
        return OpportunityStatus.parse(source);
    }
}