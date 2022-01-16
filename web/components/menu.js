import Link from "next/link";
import Blog from "../pages/blog";

const Menu = () => {
  return (
    <ul className="flex flex-row justify-between gap-x-3">
      <li>
        <Link href="/">@Me</Link>
      </li>
      <li>
        <Link href="/blog">My blog posts</Link>
      </li>
    </ul>
  )
}

export default Menu;