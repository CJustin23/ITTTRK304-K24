package com.budglee.finance.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

/**
 * =========================================================================
 * CẤU HÌNH REDIS CACHE & BỘ XỬ LÝ LỖI DỰ PHÒNG (FALLBACK PATTERN)
 * Phụ trách: Nguyễn Tiến Thành (DUAN-42)
 *
 * Tính năng chính:
 * 1. RedisCacheManager: TTL 10 phút, JSON Serialization chuẩn.
 * 2. CacheErrorHandler (Fallback Pattern): Bắt mọi lỗi kết nối Redis (timeout,
 *    connection refused, sập Redis container/service) và tự động fallback
 *    truy vấn trực tiếp CSDL MySQL, triệt tiêu hoàn toàn lỗi 500 khi Redis tắt.
 * =========================================================================
 */
@Configuration
@EnableCaching
@Slf4j
public class RedisConfig implements CachingConfigurer {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer();

        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);

        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration cacheConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(cacheConfig)
                .build();
    }

    /**
     * CacheErrorHandler: Fallback Pattern
     * Khi Redis sập hoặc không kết nối được, các phương thức này bắt lỗi và log warning
     * thay vì re-throw exception, giúp ứng dụng tự động truy vấn CSDL MySQL và trả 200 OK.
     */
    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
                log.warn("[REDIS CACHE FALLBACK] Không thể đọc cache '{}' cho key '{}' (Redis offline/lỗi: {}). Tự động fallback truy vấn MySQL.",
                        cache != null ? cache.getName() : "unknown", key, exception.getMessage());
            }

            @Override
            public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
                log.warn("[REDIS CACHE FALLBACK] Không thể ghi cache '{}' cho key '{}' (Redis offline/lỗi: {}). Bỏ qua lỗi ghi.",
                        cache != null ? cache.getName() : "unknown", key, exception.getMessage());
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
                log.warn("[REDIS CACHE FALLBACK] Không thể xóa cache '{}' cho key '{}' (Redis offline/lỗi: {}).",
                        cache != null ? cache.getName() : "unknown", key, exception.getMessage());
            }

            @Override
            public void handleCacheClearError(RuntimeException exception, Cache cache) {
                log.warn("[REDIS CACHE FALLBACK] Không thể dọn cache '{}' (Redis offline/lỗi: {}).",
                        cache != null ? cache.getName() : "unknown", exception.getMessage());
            }
        };
    }
}
