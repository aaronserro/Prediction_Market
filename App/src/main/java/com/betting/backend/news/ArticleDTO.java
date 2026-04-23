package com.betting.backend.news;

public record ArticleDTO(
    String title,
    String description,
    String url,
    String urlToImage,
    String publishedAt,
    SourceDTO source
) {}
