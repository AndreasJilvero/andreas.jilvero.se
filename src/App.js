import './App.css';
import me from './me.png';
import { Home } from './components/Home';
import { Contact } from './components/Contact';
import { BrowserRouter, Route, Routes, Outlet, Link } from 'react-router-dom';

const Layout = () => {
  return (
    <div className='container min-h-screen min-w-full bg-gray-200 grid justify-center md:py-8'>
      <div className='max-w-screen-md'>
        <header className='bg-white shadow-xl shadow-rose-900 px-8 pt-8 pb-4 border-b border-indigo-500 md:rounded-t-xl text-center'>
          <h1 className='text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-yellow-500'>
            Andreas Jilvero <span className='hidden md:inline'>(AB)</span>
          </h1>
          <br />
          <img className='border-8 border-indigo-500 rounded-full mx-auto object-cover h-48' src={me} alt="me" />
          <ul className='flex flex-row gap-x-3'>
            <li>
              <Link to="/">@Me</Link>
            </li>
          </ul>
        </header>

        <div className='p-8 bg-white shadow-xl shadow-rose-900'>
          <Outlet />
        </div>

        <div className='p-8 bg-white shadow-xl shadow-rose-900 grid justify-between grid-cols-1 md:grid-cols-2 gap-3 md:gap-0 border-t border-pink-500 md:rounded-b-xl'>
          <div className=''>
            Andreas Jilvero AB<br />
            Västmannagatan 44<br />
            113 25 Stockholm
          </div>
          <div className='md:text-right'>
            Organisationsnummer: 559237-3004<br />
            Innehar F-skatt
          </div>
        </div>
      </div>
    </div>
  );
}

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/contact" element={<Contact />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;