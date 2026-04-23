package com.betting.backend.news;

import java.util.ArrayList;

import org.springframework.stereotype.Service;

import org.springframework.cache.annotation.Cacheable;

@Service
public class NewsService {
    private final NewsClient newsClient;

    public NewsService(NewsClient newsClient) {
        this.newsClient = newsClient;
    }

    /**
     * Fetches news based on the category.
     * Use @Cacheable to store results in memory.
     * 'newsCache' is the name of the cache, 'category' is the unique key.
     */
    @Cacheable(value = "newsCache", key = "#category")
    public NewsResponseDTO getTopHeadlines(NewsCategory category) {
        System.out.println("Fetching fresh news for: " + category); // To verify caching in logs

        try {
            // Convert Enum to lowercase string for NewsAPI (e.g., FINANCE -> "business")
            String apiCategory = mapCategory(category);

            return newsClient.fetchFromExternalApi(apiCategory);
        } catch (Exception e) {
            // Fallback logic: return an empty DTO or log the error
            // This prevents your whole app from crashing if NewsAPI is down
            return new NewsResponseDTO("error", 0, new ArrayList<>());
        }
    }
    private String mapCategory(NewsCategory category) {
        return switch (category) {
            case FINANCE -> "business";
            case TECHNOLOGY -> "technology";
            case SPORTS -> "sports";
            case POLITICS -> "politics";
            default -> "general";
        };
    }

}
