import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazyRoutes } from './router/lazyRoutes';
import { MainLayout } from './components/layout/MainLayout';
import NotFound from './pages/error/NotFound';
import "./App.css";

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          {lazyRoutes.map((route, index) => (
            <Route
              key={index}
              path={route.path}
              element={route.element}
            >
              {route.children?.map((childRoute, childIndex) => (
                <Route
                  key={childIndex}
                  index={childRoute.index}
                  path={childRoute.path}
                  element={childRoute.element}
                />
              ))}
            </Route>
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
