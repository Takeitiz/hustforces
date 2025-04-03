//package com.hust.hustforces.exception;
//
//import org.springframework.http.HttpStatus;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.authentication.BadCredentialsException;
//import org.springframework.validation.FieldError;
//import org.springframework.web.bind.MethodArgumentNotValidException;
//import org.springframework.web.bind.annotation.ControllerAdvice;
//import org.springframework.web.bind.annotation.ExceptionHandler;
//
//import java.time.ZoneId;
//import java.time.ZonedDateTime;
//import java.util.HashMap;
//import java.util.Map;
//
//@ControllerAdvice
//public class CustomExceptionHandler {
//
//    @ExceptionHandler(value = {ResourceNotFoundException.class})
//    public ResponseEntity<Object> handleResourceNotFoundException(ResourceNotFoundException e) {
//        HttpStatus notFound = HttpStatus.NOT_FOUND;
//        ApiException apiException = new ApiException(
//                e.getMessage(),
//                notFound,
//                ZonedDateTime.now(ZoneId.systemDefault())
//        );
//        return new ResponseEntity<>(apiException, notFound);
//    }
//
//    @ExceptionHandler(value = {IllegalArgumentException.class})
//    public ResponseEntity<Object> handleIllegalArgumentException(IllegalArgumentException e) {
//        HttpStatus badRequest = HttpStatus.BAD_REQUEST;
//        ApiException apiException = new ApiException(
//                e.getMessage(),
//                badRequest,
//                ZonedDateTime.now(ZoneId.systemDefault())
//        );
//        return new ResponseEntity<>(apiException, badRequest);
//    }
//
//    @ExceptionHandler(value = {BadCredentialsException.class})
//    public ResponseEntity<Object> handleBadCredentialsException(BadCredentialsException e) {
//        HttpStatus unauthorized = HttpStatus.UNAUTHORIZED;
//        ApiException apiException = new ApiException(
//                "Invalid username or password",
//                unauthorized,
//                ZonedDateTime.now(ZoneId.systemDefault())
//        );
//        return new ResponseEntity<>(apiException, unauthorized);
//    }
//
//    @ExceptionHandler(MethodArgumentNotValidException.class)
//    public ResponseEntity<Object> handleValidationExceptions(MethodArgumentNotValidException ex) {
//        Map<String, String> errors = new HashMap<>();
//        ex.getBindingResult().getAllErrors().forEach((error) -> {
//            String fieldName = ((FieldError) error).getField();
//            String errorMessage = error.getDefaultMessage();
//            errors.put(fieldName, errorMessage);
//        });
//        return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
//    }
//
//    @ExceptionHandler(Exception.class)
//    public ResponseEntity<Object> handleAllExceptions(Exception ex) {
//        HttpStatus internalServerError = HttpStatus.INTERNAL_SERVER_ERROR;
//        ApiException apiException = new ApiException(
//                "An unexpected error occurred: " + ex.getMessage(),
//                internalServerError,
//                ZonedDateTime.now(ZoneId.systemDefault())
//        );
//        return new ResponseEntity<>(apiException, internalServerError);
//    }
//}
