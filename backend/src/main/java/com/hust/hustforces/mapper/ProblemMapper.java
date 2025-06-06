package com.hust.hustforces.mapper;

import com.hust.hustforces.model.dto.problem.ProblemDto;
import com.hust.hustforces.model.entity.Problem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

// In ProblemMapper
@Mapper(componentModel = "spring")
public interface ProblemMapper {

    @Mapping(target = "totalSubmissions", ignore = true)
    @Mapping(target = "acceptanceRate", ignore = true)
    ProblemDto toProblemDto(Problem problem);

    default ProblemDto toProblemDtoWithStats(Problem problem, int totalSubmissions, int acceptedSubmissions) {
        ProblemDto dto = toProblemDto(problem);
        dto.setTotalSubmissions(totalSubmissions);
        if (totalSubmissions > 0) {
            dto.setAcceptanceRate((double) acceptedSubmissions / totalSubmissions * 100);
        } else {
            dto.setAcceptanceRate(0.0);
        }
        return dto;
    }
}
