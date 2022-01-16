import Link from "next/link";

const Menu = () => {
  return (
    <ul className="flex flex-row justify-between gap-x-3">
      <li>
        <Link href="/">@Me</Link>
      </li>
      <li>
        <Link href="/blog">My blog</Link>
      </li>
    </ul>
  )
}

export default Menu;