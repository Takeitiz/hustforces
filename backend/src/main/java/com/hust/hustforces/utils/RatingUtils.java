package com.hust.hustforces.utils;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

public class RatingUtils {

    /**
     * Get the title for a given rating
     */
    public static RatingTitle getTitleForRating(int rating) {
        if (rating < 800) {
            return RatingTitle.NEWBIE;
        } else if (rating < 1200) {
            return RatingTitle.BEGINNER;
        } else if (rating < 1500) {
            return RatingTitle.APPRENTICE;
        } else if (rating < 1800) {
            return RatingTitle.SPECIALIST;
        } else if (rating < 2100) {
            return RatingTitle.EXPERT;
        } else if (rating < 2400) {
            return RatingTitle.CANDIDATE_MASTER;
        } else if (rating < 2700) {
            return RatingTitle.MASTER;
        } else if (rating < 3000) {
            return RatingTitle.GRANDMASTER;
        } else {
            return RatingTitle.LEGENDARY_GRANDMASTER;
        }
    }

    /**
     * Rating titles with color codes
     */
    @Getter
    @RequiredArgsConstructor
    public enum RatingTitle {
        NEWBIE("Newbie", "#CCCCCC"),
        BEGINNER("Beginner", "#77FF77"),
        APPRENTICE("Apprentice", "#77DDBB"),
        SPECIALIST("Specialist", "#AAAAFF"),
        EXPERT("Expert", "#FF88FF"),
        CANDIDATE_MASTER("Candidate Master", "#FFCC88"),
        MASTER("Master", "#FFBB55"),
        GRANDMASTER("Grandmaster", "#FF7777"),
        LEGENDARY_GRANDMASTER("Legendary Grandmaster", "#FF3333");

        private final String title;
        private final String color;
    }
}
