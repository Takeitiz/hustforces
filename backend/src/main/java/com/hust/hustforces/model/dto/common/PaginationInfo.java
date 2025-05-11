package com.hust.hustforces.model.dto.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PaginationInfo {
    private int currentPage;
    private int pageSize;
    private long totalItems;
    private int totalPages;
}


