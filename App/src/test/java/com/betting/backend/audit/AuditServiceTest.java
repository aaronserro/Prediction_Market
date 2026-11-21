package com.betting.backend.audit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.lang.reflect.Method;
import java.util.Arrays;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import com.betting.backend.config.RequestCorrelationFilter;

class AuditServiceTest {

    @Test
    void successEventContainsOnlySanitizedIdentifiersAndCorrelationId() {
        AuditEventRepository repository = mock(AuditEventRepository.class);
        AuditService service = new AuditService(repository);

        service.success(99L, "MARKET_RESOLVE", "MARKET", "market-123", "request-456");

        ArgumentCaptor<AuditEvent> event = ArgumentCaptor.forClass(AuditEvent.class);
        verify(repository).save(event.capture());
        assertThat(event.getValue().getActorUserId()).isEqualTo(99L);
        assertThat(event.getValue().getAction()).isEqualTo("MARKET_RESOLVE");
        assertThat(event.getValue().getTargetType()).isEqualTo("MARKET");
        assertThat(event.getValue().getTargetId()).isEqualTo("market-123");
        assertThat(event.getValue().getOutcome()).isEqualTo("SUCCESS");
        assertThat(event.getValue().getCorrelationId()).isEqualTo("request-456");
        assertThat(event.getValue().getOccurredAt()).isNotNull();
        assertThat(event.getValue().getId()).isNotNull();
    }

    @Test
    void rejectedEventCannotStoreSecretsBodiesEmailsOrRawKeysAsIdentifiers() {
        AuditService service = new AuditService(mock(AuditEventRepository.class));

        assertThatThrownBy(() -> service.rejected(
                99L, "ADMIN_LOGIN", "USER", "alice@example.com", "request-1"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.success(
                99L, "TRADE_BUY", "TRADE", "{\"password\":\"secret\"}", "request-1"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.success(
                99L, "WALLET_DEPOSIT", "USER", "7", "raw key with spaces"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void auditEntityAndRepositoryExposeNoApplicationMutationOrDeletionApi() {
        assertThat(Arrays.stream(AuditEvent.class.getMethods())
                .map(Method::getName)
                .filter(name -> name.startsWith("set")))
                .isEmpty();
        assertThat(Arrays.stream(AuditEventRepository.class.getMethods())
                .map(Method::getName))
                .doesNotContain("delete", "deleteById", "deleteAll");
    }

    @Test
    void correlationFilterAcceptsSafeIdsAndReplacesUnsafeIds() throws Exception {
        RequestCorrelationFilter filter = new RequestCorrelationFilter();
        MockHttpServletRequest safeRequest = new MockHttpServletRequest();
        safeRequest.addHeader(RequestCorrelationFilter.HEADER_NAME, "request-123");
        MockHttpServletResponse safeResponse = new MockHttpServletResponse();

        filter.doFilter(safeRequest, safeResponse, new MockFilterChain());
        assertThat(safeResponse.getHeader(RequestCorrelationFilter.HEADER_NAME))
                .isEqualTo("request-123");

        MockHttpServletRequest unsafeRequest = new MockHttpServletRequest();
        unsafeRequest.addHeader(RequestCorrelationFilter.HEADER_NAME, "secret value with spaces");
        MockHttpServletResponse unsafeResponse = new MockHttpServletResponse();
        filter.doFilter(unsafeRequest, unsafeResponse, new MockFilterChain());
        assertThat(unsafeResponse.getHeader(RequestCorrelationFilter.HEADER_NAME))
                .matches("[0-9a-f-]{36}");
    }
}
