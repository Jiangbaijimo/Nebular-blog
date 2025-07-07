import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazyRoutes } from './router/lazyRoutes';
import { MainLayout } from './components/layout/MainLayout';
import AppInitializer from './components/app/AppInitializer';
import "./App.css";

function App() {
  return (
    <Router>
      <AppInitializer>
        <Routes>
          {lazyRoutes.map((route, index) => {
            // Admin路由完全独立，不使用MainLayout
            if (route.path?.startsWith('/admin')) {
              return (
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
              );
            }
            
            // 其他路由使用MainLayout
            return (
              <Route
                key={index}
                path={route.path}
                element={
                  <MainLayout>
                    {route.element}
                  </MainLayout>
                }
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
            );
          })}        </Routes>
      </AppInitializer>
    </Router>
  );
}

export default App;
