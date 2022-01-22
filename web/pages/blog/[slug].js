import client from '../../client'
import BlockContent from '@sanity/block-content-to-react'
import Head from 'next/head'

const serializers = {
  types: {
    block: (props) => props.node.style === "normal" ? (
      <p className="my-4">{props.children}</p>
    ) : (
      <></>
    ),
    code: (props) => (
      <pre className="m-auto bg-slate-900 text-slate-300 text-xs p-4 whitespace-pre-wrap rounded-xl" data-language={props.node.language}>
        <code>{props.node.code}</code>
      </pre>
    ),
  },
}

const Post = ({post}) => {
  return (
    <>
      <Head>
        <title>Andreas Jilvero AB - {post?.title}</title>
      </Head>

      <article>
        <h2>{post?.title}</h2>
        <BlockContent
          blocks={post?.body}
          imageOptions={{ w: 320, h: 240, fit: 'max' }}
          {...client.config()}
          serializers={serializers}
        />
      </article>
    </>
  )
}

export async function getStaticPaths() {
  const paths = await client.fetch(
    `*[_type == "post" && defined(slug.current)][].slug.current`
  )

  return {
    paths: paths.map((slug) => ({params: {slug}})),
    fallback: true,
  }
}

export async function getStaticProps(context) {
  // It's important to default the slug so that it doesn't return "undefined"
  const { slug = "" } = context.params
  const post = await client.fetch(`
    *[_type == "post" && slug.current == $slug][0]
  `, { slug })
  return {
    props: {
      post
    }
  }
}

export default Post;