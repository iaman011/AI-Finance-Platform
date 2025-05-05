import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import Image from "next/image";
import logo from "../public/Screenshot 2025-05-02 170831.png";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { LayoutDashboard, PenBox } from "lucide-react";

const Header = () => {
  return (
    <div className="fixed top-o w-full bg-white/80 backdrop-blur-md z-50 border-b">
      <nav className="container mx-auto px-4 py-2 flex items-center justify-between">
        <Link href="/">
          <Image
            src={logo}
            alt="logo"
            height={60}
            width={200}
            className="h-12 w-auto object-contain"
          />
        </Link>


        <div className="flex items-center space-x-4">

          <SignedIn>

            <Link href={"/Dashboard"} className="text-gray-600 hover:text-blue-600 flex items-center gap-2">
          <Button variant="outline">
            <LayoutDashboard size={18} />
            <span className="hidden md:inline">Dashboard</span>
          </Button>
          </Link>

          <Link href={"/transaction/create"}>
          <Button className="flex items-center gap-2">
            <PenBox size={18} />
            <span className="hidden md:inline">Add Transaction</span>
          </Button>
          </Link>


          </SignedIn>

  

        <SignedOut>
        <SignInButton forceRedirectUrl="/dashboard">
          <Button variant="outline">Login</Button>
          </SignInButton>
          {/* <SignUpButton /> */}
        </SignedOut>
        <SignedIn>
          {/* authentication using gmail create user icon */}
          <UserButton 
          appearance={{
            elements:{
              avatarBox: "w-12 h-12",
            },
          }}
          />
        </SignedIn>
        </div>
      </nav>
    </div>
  );
};

export default Header;
