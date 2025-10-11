import NxWelcome from './nx-welcome';
import { Route, Routes, Link } from 'react-router-dom';
import SbcAgentSim from './SbcAgentSim'; // ⬅️ add this

export function App() {
  return (
    <div>
      <NxWelcome title="@workspace/web-app" />

      <br />
      <hr />
      <br />
      <div role="navigation">
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/page-2">Page 2</Link></li>
          <li><Link to="/sbc-agent-sim">SBC Agent Simulator</Link></li> {/* ⬅️ new */}
        </ul>
      </div>

      <Routes>
        <Route
          path="/"
          element={
            <div>
              This is the generated root route.{' '}
              <Link to="/page-2">Click here for page 2.</Link>
            </div>
          }
        />
        <Route
          path="/page-2"
          element={<div><Link to="/">Click here to go back to root page.</Link></div>}
        />
        <Route path="/sbc-agent-sim" element={<SbcAgentSim />} /> {/* ⬅️ new */}
      </Routes>
    </div>
  );
}

export default App;
