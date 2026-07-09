package com.example.Innovation_backend.project;

import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

/**
 * Spring converter to bind {@code @RequestParam("phase") ProjectPhase}
 * from query strings (e.g. {@code PATCH /api/projects/{id}/phase?phase=mvp}).
 * Accepts both lowercase ("mvp") and uppercase ("MVP").
 */
@Component
public class ProjectPhaseConverter implements Converter<String, ProjectPhase> {
    @Override
    public ProjectPhase convert(String source) {
        return ProjectPhase.parse(source);
    }
}