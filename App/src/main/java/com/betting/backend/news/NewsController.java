package com.betting.backend.news;
import org.springframework.http.ResponseEntity;
import org.springframework.http.CacheControl;
import org.springframework.web.bind.annotation.*;
import com.betting.backend.auth.ratelimit.PublicReadRateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1/news")
public class NewsController {

    private final NewsService newsService;
    private final PublicReadRateLimiter rateLimiter;

    public NewsController(NewsService newsService, PublicReadRateLimiter rateLimiter) {
        this.newsService = newsService;
        this.rateLimiter = rateLimiter;
    }

    /**
     * Endpoint: GET /api/v1/news/{category}
     * Example: /api/v1/news/FINANCE
     */
    @GetMapping("/{category}")
    public ResponseEntity<NewsResponseDTO> getNews(
            @PathVariable NewsCategory category, HttpServletRequest request) {
        rateLimiter.checkNews(request.getRemoteAddr());
        NewsResponseDTO response = newsService.getTopHeadlines(category);

        // Return 200 OK with the news data
        return ResponseEntity.ok()
            .cacheControl(CacheControl.maxAge(5, TimeUnit.MINUTES).cachePublic())
            .body(response);
    }
}