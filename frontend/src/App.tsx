import './App.css'
import {BrowserRouter} from "react-router-dom";
import {Appbar} from "./components/layout/Appbar/Appbar.tsx";
import {Footer} from "./components/layout/Footer/Footer.tsx";
import {AppRoutes} from "./routes";

function App() {
  return (
      <BrowserRouter>
          <Appbar />
          <main className="content-container">
              <AppRoutes />
          </main>
          <Footer />
      </BrowserRouter>
  )
}

export default App
