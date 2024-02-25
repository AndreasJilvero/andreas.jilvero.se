module.exports = {
  trailingSlash: true,
  async redirects() {
    return [
      {
        source: '/blog/',
        destination: '/',
        permanent: false,
      },
    ]
  },
}