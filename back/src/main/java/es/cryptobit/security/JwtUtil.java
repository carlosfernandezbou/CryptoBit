package es.cryptobit.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;

import java.security.Key;
import java.util.Date;

public class JwtUtil {

    private static final String SECRET =
            "MiClaveSuperLargaParaJWT123456789123456789";

    private static final Key key =
            Keys.hmacShaKeyFor(SECRET.getBytes());

    public static String generateToken(String email){

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(
                        new Date(System.currentTimeMillis()
                                + 1000*60*30)
                )
                .signWith(key)
                .compact();
    }

    public static String validateToken(String token){

        try {

            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            return claims.getSubject();

        } catch (ExpiredJwtException e){

            System.out.println("TOKEN CADUCADO");

            return null;
        }
    }
}