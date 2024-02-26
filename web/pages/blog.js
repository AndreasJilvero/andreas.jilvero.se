const Blog = () => {
  return (
    <></>
  )
}

export async function getServerSideProps(context) {
  return {
    redirect: {
      destination: '/',
      permanent: false,
    },
  }
}

export default Blog