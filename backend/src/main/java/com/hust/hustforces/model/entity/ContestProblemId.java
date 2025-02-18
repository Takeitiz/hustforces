package com.hust.hustforces.model.entity;

import lombok.Data;

import java.io.Serializable;

@Data
public class ContestProblemId implements Serializable {
    private String contestId;
    private String problemId;
}
