package com.hust.hustforces.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class RabbitMQConfig {

    public static final String JUDGE_EXCHANGE_NAME = "judge.exchange";
    public static final String JUDGE_RESULT_QUEUE_NAME = "judge.result.queue";
    public static final String JUDGE_RESULT_ROUTING_KEY = "judge.result.key";

    public static final String JUDGE_DLQ_NAME = "judge.result.dlq";
    public static final String JUDGE_DLQ_ROUTING_KEY = "judge.result.dlq.key";
    public static final String JUDGE_RETRY_QUEUE_NAME = "judge.result.retry";
    public static final String JUDGE_RETRY_ROUTING_KEY = "judge.result.retry.key";

    @Bean
    Queue judgeResultQueue() {
        return QueueBuilder.durable(JUDGE_RESULT_QUEUE_NAME)
                .withArgument("x-dead-letter-exchange", JUDGE_EXCHANGE_NAME)
                .withArgument("x-dead-letter-routing-key", JUDGE_DLQ_ROUTING_KEY)
                .build();
    }

    @Bean
    Queue judgeResultDLQ() {
        return QueueBuilder.durable(JUDGE_DLQ_NAME).build();
    }

    @Bean
    Queue judgeRetryQueue() {
        return QueueBuilder.durable(JUDGE_RETRY_QUEUE_NAME)
                .withArgument("x-dead-letter-exchange", JUDGE_EXCHANGE_NAME)
                .withArgument("x-dead-letter-routing-key", JUDGE_RESULT_ROUTING_KEY)
                .withArgument("x-message-ttl", 30000) // 30 second delay before retry
                .build();
    }

    @Bean
    DirectExchange judgeExchange() {
        return new DirectExchange(JUDGE_EXCHANGE_NAME);
    }

    @Bean
    Binding judgeResultBinding(Queue judgeResultQueue, DirectExchange judgeExchange) {
        return BindingBuilder.bind(judgeResultQueue)
                .to(judgeExchange)
                .with(JUDGE_RESULT_ROUTING_KEY);
    }

    @Bean
    Binding judgeDLQBinding(Queue judgeResultDLQ, DirectExchange judgeExchange) {
        return BindingBuilder.bind(judgeResultDLQ)
                .to(judgeExchange)
                .with(JUDGE_DLQ_ROUTING_KEY);
    }

    @Bean
    Binding judgeRetryBinding(Queue judgeRetryQueue, DirectExchange judgeExchange) {
        return BindingBuilder.bind(judgeRetryQueue)
                .to(judgeExchange)
                .with(JUDGE_RETRY_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        final RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        // Add confirm callback for delivery confirmation
        rabbitTemplate.setConfirmCallback((correlationData, ack, cause) -> {
            if (!ack) {
                log.error("Message delivery failed: {}", cause);
            }
        });
        return rabbitTemplate;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            MessageConverter messageConverter) {

        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(messageConverter);

        factory.setConcurrentConsumers(1);
        factory.setMaxConcurrentConsumers(1);

        factory.setPrefetchCount(10);
        factory.setDefaultRequeueRejected(false);

        return factory;
    }
}
