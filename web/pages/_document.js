import Document, { Html, Head, Main, NextScript } from 'next/document'

class AppDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <script src="https://www.googleoptimize.com/optimize.js?id=OPT-PGQZSKP" async></script>
          <script dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-5MW8Z3C');`
            }
          }></script>

          <link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro&display=swap" rel="stylesheet" />

          <meta name="title" content="Andreas Jilvero AB" />
          <meta name="description" content="Senior, freelance IT consultant specialized within .NET and Episerver Commerce (now Optimizely) located in Stockholm, Sweden" />

          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://andreas.jilvero.se/" />
          <meta property="og:title" content="Andreas Jilvero AB" />
          <meta property="og:description" content="Senior, freelance IT consultant specialized within .NET and Episerver Commerce (now Optimizely) located in Stockholm, Sweden" />

          <meta property="twitter:url" content="https://andreas.jilvero.se/" />
          <meta property="twitter:title" content="Andreas Jilvero AB" />
          <meta property="twitter:description" content="Senior, freelance IT consultant specialized within .NET and Episerver Commerce (now Optimizely) located in Stockholm, Sweden" />
        </Head>
        <body>
          <noscript dangerouslySetInnerHTML={{
            __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5MW8Z3C" height="0" width="0" style="display:none;visibility:hidden"></iframe>`
          }} />

          <Main />

          <NextScript />
        </body>
      </Html>
    )
  }
}

export default AppDocument;