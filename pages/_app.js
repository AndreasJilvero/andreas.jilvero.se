import './../styles/globals.css'
import Layout from '../components/layout'

export default function App({ Component, pageProps, posts }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )
}
