"use client";

import React from "react";
import Link from "next/link";
import HamburgerMenu from "./HamburgerMenu";
const Navbar = () => {
  return (
    <nav className="fixed z-10 top-0 bg-gray-50 text-gray-800 w-full p-4 grid grid-cols-3 items-center">
      <a href="/" className={`text-center`}>
        LANGCHAIN JS UDEMY COURSE
      </a>
      <HamburgerMenu />
      <p className={`text-center`}>WEEKNIGHTS + WEEKENDS</p>
    </nav>
  );
};

export default Navbar;
