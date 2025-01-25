import React, { useEffect, Suspense } from 'react';
import {
  Switch as RouterSwitch,
  Route as RouterRoute,
  HashRouter as RouterHashRouter,
} from '@modern-js/runtime/router';

import './app.css';
import MindMapEditor from './pages/mind';
import { Loading } from './components/loading';

const Switch: any = RouterSwitch;
const Route: any = RouterRoute;
const HashRouter: any = RouterHashRouter;
const App = () => {
  useEffect(() => {
    const loadingIconList = Array.from(
      document.querySelectorAll('.html-init-loading-icon-container'),
    );
    loadingIconList.forEach(e => e?.parentNode?.removeChild(e));
  }, []);
  return (
    <Suspense fallback={<Loading />}>
      <HashRouter>
        <Switch>
          <Route path="/">
            <MindMapEditor />
          </Route>
          <Route path="/mind">
            <MindMapEditor />
          </Route>
        </Switch>
      </HashRouter>
    </Suspense>
  );
};
export default App;
