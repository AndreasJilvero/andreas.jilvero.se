import client from '../client'
import Link from 'next/link'
import BlockContent from '@sanity/block-content-to-react'
import Head from 'next/head'

const serializers = {
  types: {
    block: (props) => props.node.style === "normal" ? (
      <p className="pb-2">{props.children[0].substring(0, 150)}...</p>
    ) : (
      <></>
    )
  },
}

const Blog = ({posts}) => {
  return (
    <>
      <Head>
        <title>Andreas Jilvero AB - Blog posts</title>
      </Head>

      <div>
        <h2 className='pb-4'>My blog</h2>

        <div className='grid grid-cols-1 gap-2'>
          {posts && posts.length > 0 && posts.map(({ _id, title = '', slug = '', body }) =>
                slug && (
                  <div key={_id} className='bg-slate-100 p-4'>
                    <Link href="/blog/[slug]" as={`/blog/${slug.current}`}>
                        <a className=''>
                          <h4 className='text-xl pb-2'>{title}</h4>
                          <BlockContent
                            blocks={body[0]}
                            imageOptions={{ w: 320, h: 240, fit: 'max' }}
                            {...client.config()}
                            serializers={serializers}
                          />
                          <p className='underline text-indigo-500'>Read more</p>
                        </a>
                    </Link>{' '}
                  </div>
              )
          )}
        </div>

        <p className='pt-4'>I'll be honest - the main purpose of this blog is to drive traffic.</p>
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

export default Blog;