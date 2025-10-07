'use client'

import { SignedOut, SignInButton, SignUpButton, SignedIn, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { Button } from './ui/button'
import { CartSheet } from './CartSheet'
import Image from 'next/image'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex">
            <span className="sr-only">CodingCat.dev</span>
            <Image src="/aj.svg" alt="CodingCat.dev Logo" width={32} height={32} />
            <span className="ml-2 font-bold text-xl">CodingCat.dev</span>
          </Link>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          <Link href="/" className="text-sm font-semibold leading-6 text-gray-900">
            Home
          </Link>
          <Link href="/products" className="text-sm font-semibold leading-6 text-gray-900">
            Shoes
          </Link>
          <Link href="/blog" className="text-sm font-semibold leading-6 text-gray-900">
            Blog
          </Link>
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button>
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <CartSheet />
            <UserButton />
          </SignedIn>
        </div>

        {/* Mobile menu */}
        <div className="flex lg:hidden items-center gap-2">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <CartSheet />
            <UserButton />
          </SignedIn>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                <Link
                  href="/"
                  className="text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/products"
                  className="text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Shoes
                </Link>
                <Link
                  href="/blog"
                  className="text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Blog
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
