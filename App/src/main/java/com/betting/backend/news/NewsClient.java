package com.betting.backend.news;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class NewsClient {

    private final RestClient restClient;

    @Value("${news.api.key}")
    private String apiKey;

    public NewsClient(RestClient.Builder builder) {
        // Initialize the client with the NewsAPI base URL
        this.restClient = builder.baseUrl("https://newsapi.org/v2").build();
    }

    public NewsResponseDTO fetchFromExternalApi(String category) {
        return restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/top-headlines")
                        .queryParam("category", category)
                        .queryParam("country", "us")
                        .queryParam("apiKey", apiKey)
                        .build())
                .retrieve()
                .body(NewsResponseDTO.class);
    }
}