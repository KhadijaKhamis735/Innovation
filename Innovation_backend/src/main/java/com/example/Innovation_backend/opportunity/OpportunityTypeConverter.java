package com.example.Innovation_backend.opportunity;

import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

/**
 * Spring converter to bind {@code @RequestParam("type") OpportunityType}
 * from query strings (e.g. {@code GET /api/opportunities?type=grant}).
 * Accepts both lowercase ("grant") and uppercase ("GRANT").
 */
@Component
public class OpportunityTypeConverter implements Converter<String, OpportunityType> {
    @Override
    public OpportunityType convert(String source) {
        return OpportunityType.parse(source);
    }
}