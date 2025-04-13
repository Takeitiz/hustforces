package com.hust.hustforces.model.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "Language")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Language extends BaseEntity {
    @Id
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private int judge0Id;

    @OneToMany(mappedBy = "language", cascade = CascadeType.ALL)
    private List<DefaultCode> defaultCodes;
}
