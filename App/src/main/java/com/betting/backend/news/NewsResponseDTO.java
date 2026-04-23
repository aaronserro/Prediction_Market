package com.betting.backend.news;

import java.util.List;

// The top-level wrapper
public record NewsResponseDTO(
    String status,
    int totalResults,
    List<ArticleDTO> articles
) {}