package com.betting.backend.news;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/news")
// If your React Native app is running on a different port/domain during dev
@CrossOrigin(origins = "*")
public class NewsController {

    private final NewsService newsService;

    public NewsController(NewsService newsService) {
        this.newsService = newsService;
    }

    /**
     * Endpoint: GET /api/v1/news/{category}
     * Example: /api/v1/news/FINANCE
     */
    @GetMapping("/{category}")
    public ResponseEntity<NewsResponseDTO> getNews(@PathVariable NewsCategory category) {
        NewsResponseDTO response = newsService.getTopHeadlines(category);

        // Return 200 OK with the news data
        return ResponseEntity.ok(response);
    }
}