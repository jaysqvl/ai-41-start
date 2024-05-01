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
      <div className="hidden">
        <Link href="/">Home 🏡 </Link>

        <Link href="/pdf">PDF-GPT 👨🏻‍🏫</Link>
        <Link href="/memory">Memory 🧠</Link>
        <Link href="/streaming">Streaming 🌊</Link>

        {/* Documents / QA */}
        <Link href="/transcript-qa">YouTube Video Chat 💬</Link>

        {/* APIs, Templates, Agents */}
        <Link href="/content-generator">AI Content Wizard 🧙🏼</Link>

        {/* Documents / Database */}
        <Link href="/resume-reader">RoboHR 🤖</Link>
        <Link href="/api-tester">Testing ⚠️</Link>
      </div>
    </nav>
  );
};

export default Navbar;
