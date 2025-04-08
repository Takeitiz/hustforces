package com.hust.hustforces.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.amqp.core.Queue;

@Configuration
public class RabbitMQConfig {

    public static final String JUDGE_EXCHANGE_NAME = "judge.exchange";
    public static final String JUDGE_RESULT_QUEUE_NAME = "judge.result.queue";
    public static final String JUDGE_RESULT_ROUTING_KEY = "judge.result.key";

    @Bean
    Queue judgeResultQueue() {
        return new Queue(JUDGE_RESULT_QUEUE_NAME, true);
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
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        final RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }
}
