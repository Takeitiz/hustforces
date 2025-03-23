import {Route, Routes} from "react-router-dom";
import {HomePage} from "../pages/Home/HomePage.tsx";
import {ProblemPage} from "../pages/Problem/ProblemPage.tsx";


export function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<HomePage/>}/>
            <Route path="/problem/:problemId" element={<ProblemPage/>} />
        </Routes>
    )
}