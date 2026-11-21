package com.betting.backend.news;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.betting.backend.auth.ratelimit.PublicReadRateLimiter;

import jakarta.servlet.http.HttpServletRequest;

class NewsControllerTest {

    @Test
    void publicNewsIsLimitedAndPubliclyCached() {
        NewsService newsService = mock(NewsService.class);
        PublicReadRateLimiter limiter = mock(PublicReadRateLimiter.class);
        HttpServletRequest request = mock(HttpServletRequest.class);
        NewsResponseDTO news = new NewsResponseDTO("ok", 0, List.of());
        when(request.getRemoteAddr()).thenReturn("203.0.113.10");
        when(newsService.getTopHeadlines(NewsCategory.FINANCE)).thenReturn(news);

        var response = new NewsController(newsService, limiter)
                .getNews(NewsCategory.FINANCE, request);

        verify(limiter).checkNews("203.0.113.10");
        assertThat(response.getBody()).isSameAs(news);
        assertThat(response.getHeaders().getCacheControl())
                .contains("public").contains("max-age=300");
    }
}