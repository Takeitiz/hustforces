package com.hust.hustforces.service;

import java.io.IOException;

public interface ImportService {
    public void processProblem(String problemSlug) throws IOException;
    public void addProblemsInDB();
    public void seedLanguagesFromMapping();
}
