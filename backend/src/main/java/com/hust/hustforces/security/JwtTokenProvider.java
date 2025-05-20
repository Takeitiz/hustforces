package com.hust.hustforces.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.hust.hustforces.model.entity.User;
import com.hust.hustforces.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;


@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${jwt.secret:defaultSecretKey12345678901234567890123456789012}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpirationInMs;

    private final UserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private Algorithm algorithm;

    public JwtTokenProvider(UserDetailsService userDetailsService, UserRepository userRepository) {
        this.userDetailsService = userDetailsService;
        this.userRepository = userRepository;
    }

    @PostConstruct
    protected void init() {
        this.algorithm = Algorithm.HMAC256(jwtSecret);
    }

    public String generateToken(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return JWT.create()
                .withSubject(username)
                .withClaim("role", user.getRole().toString())
                .withIssuedAt(now)
                .withExpiresAt(expiryDate)
                .sign(algorithm);
    }

    public String getUsernameFromToken(String token) {
        DecodedJWT jwt = JWT.decode(token);
        return jwt.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            JWT.require(algorithm)
                    .build()
                    .verify(token);
            return true;
        } catch (JWTVerificationException ex) {
            log.error("Invalid JWT token: {}", ex.getMessage());
            return false;
        }
    }

    public Authentication getAuthentication(String token) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(getUsernameFromToken(token));
        return new UsernamePasswordAuthenticationToken(userDetails, "", userDetails.getAuthorities());
    }
}
