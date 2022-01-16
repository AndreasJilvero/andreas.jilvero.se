import './../styles/globals.css'
import Layout from '../components/layout'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Andreas Jilvero AB</title>
      </Head>

      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  )
}
