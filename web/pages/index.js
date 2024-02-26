import client from "../client"
import Link from 'next/link'
import Head from 'next/head'

const Index = ({posts}) => {
    return (
      <>
        <Head>
          <title>Andreas Jilvero AB - IT consultant</title>
        </Head>

        <h1 className="pb-8">Andreas Jilvero AB</h1>
        
        <p className='text-xl pb-4'>Hello!</p>

        <p className='pb-2'>
          My name is Andreas Jilvero and I'm a senior, freelance consultant within Web and .NET. I live in Stockholm, Sweden and enjoy both working on location and remote.
        </p>

        <p className='pb-8'>
          I've been in the business for nearly 11 years, and the majority of that time has been focused on the platform Episerver (now Optimizely).
          More often than not, it's been in combination with the Commerce add-on, on some major Swedish e-commerce company.
          Other than that, I'm experienced with almost anything in the .NET world.
        </p>

        <h2 className="pb-8">My blog</h2>

        <div className='grid grid-cols-1 gap-8'>
          {posts 
            && posts.map(({ _id, title = '', slug = '', _updatedAt = '', summary }) =>
              slug && (
                <div key={_id} className='md:border-l-8 md:pl-8' itemScope itemtype="http://schema.org/Article">
                  <Link href="/blog/[slug]" as={`/blog/${slug.current}`} className="reset-a">
                        <h4 className='text-xl pb-2' itemprop="name">{title}</h4>
                        <p className="pb-4">{summary}</p>
                        <div className='flex place-content-between'>
                          <p className='underline text-indigo-500'>Read more</p>
                          {_updatedAt && (
                            <p className='text-sm'>
                              <time itemprop="datePublished" datetime={new Date(_updatedAt).toLocaleDateString("sv-SE")}>{new Date(_updatedAt).toLocaleDateString("sv-SE")}</time>
                            </p>
                          )}
                        </div>
                  </Link>
                </div>
              )
          )}
        </div>
      </>
    )
}

export async function getStaticProps() {
  const posts = await client.fetch(`
    *[_type == "post" && publishedAt < now()] | order(publishedAt desc)
  `)
  return {
    props: {
      posts
    }
  }
}

export const config = {
  unstable_runtimeJS: false
}

export default Index;