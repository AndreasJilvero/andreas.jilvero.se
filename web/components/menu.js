import Link from "next/link";

const Menu = () => {
  return (
    <ul className="flex flex-row justify-between gap-x-3">
      <li>
        <Link href="/">
          <a className="underline">@Me</a>
        </Link>
      </li>
      <li>
        <Link href="/blog">
        <a className="underline">My blog</a>
        </Link>
      </li>
    </ul>
  )
}

export default Menu;