export const Home = () => {
  return (
    <>
      <h2 className='text-2xl pb-4'>Hello!</h2>

      <p className='pb-3'>
        My name is Andreas Jilvero and I'm a freelance consultant within Web and .NET. I live in Stockholm, Sweden and enjoy both working on location and remote.
      </p>

      <p className='pb-3'>
        I've been in the business for nearly 11 years, and the majority of that time has been focused on the platform Episerver (now Optimizely).
        More often than not, it's been in combination with the Commerce add-on, on some major Swedish e-commerce company.
        Other than that, I'm experienced with almost everything in the .NET world.
      </p>
      
      <dl className='grid justify-center py-4 gap-x-4 gap-y-2'>
        {[
          ['Skills', ['.NET', 'Episerver/Optimizely CMS and Commerce', 'Web development']],
          ['Location', ['Stockholm, Sweden']],
          ['Contact me', [<a className='text-blue-500 underline' href="mailto:andreas.jilvero@gmail.com">andreas.jilvero@gmail.com</a>]],
          ['LinkedIn', [<a className='text-blue-500 underline' href="https://www.linkedin.com/in/andreas-jilvero-51b8474a/">Andreas Jilvero</a>]],
        ].map(([key, values]) => (
          <>
            <dt className='col-start-1 text-right'>{key}</dt>
            {values.map(value => (<dd className='col-start-2'>{value}</dd>))}
          </>
        ))}
      </dl>
    </>
  );
}
