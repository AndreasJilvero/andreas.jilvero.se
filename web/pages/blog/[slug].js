import client from '../../client'
import BlockContent from '@sanity/block-content-to-react'
import imageUrlBuilder from '@sanity/image-url'
import Head from 'next/head'

const builder = imageUrlBuilder(client);

const serializers = {
  types: {
    block: (props) => {
      if (props.node.style === "normal") {
        return <p className="my-2">{props.children}</p>;
      }

      if (props.node.style === "h2") {
        return <h2 className="mt-4">{props.children}</h2>;
      }

      if (props.node.style === "h3") {
        return <h3 className="mt-4">{props.children}</h3>;
      }

      if (props.node.style === "h4") {
        return <h4 className="mt-4">{props.children}</h4>;
      }

      return <>{props.node.style}</>;
    },
    code: (props) => (
      <pre className="m-auto bg-slate-900 text-slate-300 text-xs p-4 my-4 rounded-xl overflow-x-auto" data-language={props.node.language}>
        <code>{props.node.code}</code>
      </pre>
    ),
    image: (props) => (
      <img src={builder.image(props.node).url()} className="mx-auto my-6" />
    )
  },
}

const Post = ({post}) => {
  return (
    <>
      <Head>
        <title>Andreas Jilvero AB - {post?.title}</title>
      </Head>

      <article className='blogpost' itemScope itemtype="http://schema.org/Article">
        <h2 className="mb-4">{post?.title}</h2>
        {post["_updatedAt"] && (
          <p className='pb-2 text-sm' data-js={JSON.stringify(post)}>
            Updated at <time itemprop="datePublished" datetime={new Date(post["_updatedAt"]).toLocaleDateString("sv-SE")}>{new Date(post["_updatedAt"]).toLocaleDateString("sv-SE")}</time>
          </p>
        )}
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
    fallback: false,
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

export const config = {
  unstable_runtimeJS: false
}

export default Post;