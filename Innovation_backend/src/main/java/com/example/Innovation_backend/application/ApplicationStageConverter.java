package com.example.Innovation_backend.application;

import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

/**
 * Spring converter to bind {@code @RequestParam("stage") ApplicationStage}
 * from query strings. Accepts both lowercase ("under_review") and uppercase
 * ("UNDER_REVIEW") for ergonomic frontend use.
 */
@Component
public class ApplicationStageConverter implements Converter<String, ApplicationStage> {
    @Override
    public ApplicationStage convert(String source) {
        return ApplicationStage.parse(source);
    }
}