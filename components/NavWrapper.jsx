"use client";

import { usePathname } from "next/navigation";
import NavBar from "./NavBar";

export default function NavWrapper() {
  const pathname = usePathname();

  const hideOn = ["/", "/signup"];  // No NavBar on login & signup

  if (hideOn.includes(pathname)) return null;

  return <NavBar />;
}
