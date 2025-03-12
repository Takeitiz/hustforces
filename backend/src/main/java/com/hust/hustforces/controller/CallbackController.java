package com.hust.hustforces.controller;

import com.hust.hustforces.model.dto.Judge0Response;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/callback")
@RequiredArgsConstructor
public class CallbackController {

    @PutMapping("/{}")
    public String callback(@RequestBody Judge0Response response) {
        System.out.println(response);
        return "Hello World!";
    }
}
