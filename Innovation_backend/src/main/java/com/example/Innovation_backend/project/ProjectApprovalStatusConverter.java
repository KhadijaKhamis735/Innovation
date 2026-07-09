package com.example.Innovation_backend.project;

import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

/**
 * Spring converter to bind {@code @RequestParam("status") ProjectApprovalStatus}
 * from query strings. Accepts both lowercase ("pending") and uppercase ("PENDING").
 *
 * Declared as a top-level @Component (rather than nested in the enum) so
 * component scanning reliably picks it up.
 */
@Component
public class ProjectApprovalStatusConverter implements Converter<String, ProjectApprovalStatus> {
    @Override
    public ProjectApprovalStatus convert(String source) {
        return ProjectApprovalStatus.parse(source);
    }
}