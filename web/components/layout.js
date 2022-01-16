import me from './../assets/me.png'
import Menu from "./menu";

const Layout = ({ children }) => {
  return (
    <div className='container min-h-screen min-w-full bg-gray-200 grid justify-center md:py-8'>
      <div className='max-w-screen-md w-screen'>
        <header className='bg-white shadow-xl shadow-grey-900 px-8 pt-8 pb-4 border-b border-indigo-500 md:rounded-t-xl text-center'>
          <h1 className='text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-yellow-500'>
            Andreas Jilvero <span className='hidden md:inline'>AB</span>
          </h1>
          <br />
          
          <img className='border-8 border-blue-500 rounded-full mx-auto object-cover h-48' src={me.src} alt="Me" />
          
          <Menu />
        </header>

        <div className='p-8 bg-white shadow-xl shadow-grey-900'>
          {children}
        </div>

        <div className='p-8 bg-white shadow-xl shadow-grey-900 grid justify-between grid-cols-1 md:grid-cols-2 gap-3 md:gap-0 border-t border-pink-500 md:rounded-b-xl'>
          <div className=''>
            Andreas Jilvero AB<br />
            Västmannagatan 44<br />
            113 25 Stockholm
          </div>
          <div className='md:text-right'>
            Organisationsnummer: 559237-3004
          </div>
        </div>
      </div>
    </div>
  );
}


export default Layout;