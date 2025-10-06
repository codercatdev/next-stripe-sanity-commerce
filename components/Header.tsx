import { SignedOut, SignInButton, SignUpButton, SignedIn, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { Button } from './ui/button'
import { CartSheet } from './CartSheet'
import Image from 'next/image'

export function Header() {
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
            Products
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
      </nav>
    </header>
  )
}
