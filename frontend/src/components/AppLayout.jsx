import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Ticker from './Ticker';
import PageGuide from './PageGuide';

function AppLayout() {
  return (
    <>
      <Ticker />
      <Sidebar />
      <main className="content">
        <Outlet />
      </main>
      <PageGuide />
    </>
  );
}

export default AppLayout;
