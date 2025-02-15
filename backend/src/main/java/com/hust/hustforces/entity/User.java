package com.hust.hustforces.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
public class User {

    @Id
    private String id;

    private String email;

    private String name;
    private String token;
    private String password;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
