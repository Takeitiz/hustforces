import './App.css'
import {BrowserRouter} from "react-router-dom";
import {Appbar} from "./components/layout/Appbar/Appbar.tsx";
import {Footer} from "./components/layout/Footer/Footer.tsx";

function App() {
  return (
      <BrowserRouter>
          <Appbar />
          <Footer />
      </BrowserRouter>
  )
}

export default App
