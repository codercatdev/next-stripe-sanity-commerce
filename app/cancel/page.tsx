import Link from 'next/link'

export default function CancelPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold">Payment Canceled</h1>
      <p className="mt-4 text-lg">Your order has been canceled.</p>
      <Link href="/" className="mt-8 rounded-md bg-indigo-600 px-4 py-2 text-white">
        Go to Homepage
      </Link>
    </div>
  )
}
