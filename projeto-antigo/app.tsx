import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Panel } from "./pages/panel"
import { Login } from "./pages/login"
import { Logout } from "./pages/logout"

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route index element={<Panel />} />
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
