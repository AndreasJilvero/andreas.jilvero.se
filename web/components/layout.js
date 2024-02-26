import github from './../assets/github.svg'
import linkedin from './../assets/linkedin.svg'
import mail from './../assets/mail.svg'
import { useRouter } from "next/router"

const Layout = ({ children }) => {
  const router = useRouter();

  return (
    <div className="md:pl-16 bg-gray-100">
      <div className="bg-white p-8 md:px-16 md:w-[1000px] w-full min-h-screen">
        <div>
          {children}
        </div>

        <div className='mt-8 pt-8 grid justify-between grid-cols-1 md:grid-cols-2 gap-3 md:gap-0 border-t'>
          <div className=''>
            Andreas Jilvero AB<br />
            Västmannagatan 44<br />
            113 25 Stockholm
          </div>
          <div className='md:text-right'>
            Organisationsnummer: 559237-3004<br />
            Phone number: 076 035 90 11
          </div>
        </div>
        <ul className='ml-0 py-4 flex flex-row gap-x-8 justify-center bg-white'>
          {[
            ['Mail', 'mailto:andreas.jilvero@gmail.com', mail],
            ['Github', 'https://github.com/AndreasJilvero', github],
            ['LinkedIn', 'https://www.linkedin.com/in/andreas-jilvero-51b8474a/', linkedin],
          ].map(([alt, href, icon], index) => (
            <li key={index} className='p-2 rounded-md transition ease-in-out hover:bg-green-300 duration-300'>
              <a href={href}>
                <img src={icon.src} alt={alt} className="h-10" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


export default Layout;