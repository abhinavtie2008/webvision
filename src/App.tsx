import { Route, Routes } from 'react-router-dom';
import { Shell } from './components/Shell';
import { About } from './pages/About';
import { Apply } from './pages/Apply';
import { Help } from './pages/Help';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { Resume } from './pages/Resume';
import { ServiceDetail } from './pages/ServiceDetail';
import { Status } from './pages/Status';

export function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services/:slug" element={<ServiceDetail />} />
        <Route path="/apply/:id" element={<Apply />} />
        <Route path="/status" element={<Status />} />
        <Route path="/status/:reference" element={<Status />} />
        <Route path="/resume" element={<Resume />} />
        <Route path="/help" element={<Help />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Shell>
  );
}
