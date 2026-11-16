package de.mornhinweg.trainingbackend.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** Plain unit test, with the trusted proxies docker-compose.yml sets by default. */
class ClientIpResolverTest {

  private final ClientIpResolver resolver = new ClientIpResolver(new RateLimitProperties(
      null, null, null, null, null, 1,
      List.of("127.0.0.0/8", "::1", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "fc00::/7")));

  private static MockHttpServletRequest request(String remoteAddr, String... forwardedFor) {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setRemoteAddr(remoteAddr);
    for (String header : forwardedFor) {
      request.addHeader("X-Forwarded-For", header);
    }
    return request;
  }

  @Test
  void ignoresForwardedForFromUntrustedClients() {
    assertThat(resolver.resolve(request("203.0.113.5", "1.2.3.4"))).isEqualTo("203.0.113.5");
    assertThat(resolver.resolve(request("2001:db8::1", "1.2.3.4"))).isEqualTo("2001:db8::1");
  }

  @Test
  void takesTheRightmostUntrustedAddressBehindProxies() {
    // Nginx in Docker, behind a TLS proxy on the host (the Docker gateway)
    assertThat(resolver.resolve(request("172.18.0.3", "6.6.6.6, 203.0.113.5, 172.18.0.1")))
        .isEqualTo("203.0.113.5");
    assertThat(resolver.resolve(request("172.18.0.3", "garbage, 2001:db8::7"))).isEqualTo("2001:db8::7");
    // Several headers are read in order
    assertThat(resolver.resolve(request("172.18.0.3", "6.6.6.6", "203.0.113.5"))).isEqualTo("203.0.113.5");
    // A hop that isn't an IP address is never trusted
    assertThat(resolver.resolve(request("172.18.0.3", "203.0.113.5, unknown"))).isEqualTo("unknown");
  }

  @Test
  void fallsBackWhenOnlyTrustedAddressesAreKnown() {
    assertThat(resolver.resolve(request("172.18.0.3"))).isEqualTo("172.18.0.3");
    assertThat(resolver.resolve(request("172.18.0.3", "192.168.1.20"))).isEqualTo("192.168.1.20");
  }

  @Test
  void trustsNoOneByDefault() {
    ClientIpResolver none = new ClientIpResolver(new RateLimitProperties(null, null, null, null, null, 1, null));
    assertThat(none.resolve(request("127.0.0.1", "1.2.3.4"))).isEqualTo("127.0.0.1");
  }
}
