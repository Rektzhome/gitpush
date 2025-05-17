import Link from "next/link"
import { Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-black dark:to-gray-900">
      <header className="container mx-auto px-6 flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <Github className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">GitPush</h1>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
            Dashboard
          </Link>
          <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700 px-5">
            <Link href="/auth">Ayo Mulai</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16 items-center">
          <div className="space-y-6 text-center md:text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl mx-auto">
              Manage GitHub Repositories with Ease
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mx-auto">
              Otomatiskan push file, buat README, kelola repository, dan banyak lagi — semuanya lewat antarmuka modern yang intuitif.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 px-6 w-auto max-w-[180px] mx-auto sm:mx-0">
                <Link href="/auth">Ayo Mulai</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-6 w-auto max-w-[180px] mx-auto sm:mx-0">
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
            <div className="flex justify-center mt-3 pt-2">
              <ThemeToggle />
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 p-8 shadow-lg">
            <img
              src="/placeholder.svg?height=400&width=400"
              alt="GitHub Repository Management"
              className="w-full h-auto rounded-xl shadow-md"
            />
          </div>
        </div>

        <div id="features" className="py-24 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold dark:text-gray-100">Fitur Unggulan</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Semua yang kamu butuhkan untuk mengelola repository GitHub secara efisien.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 px-2">
            <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 max-w-xs mx-auto w-full">
              <CardHeader className="px-5 pt-5 pb-2">
                <CardTitle className="text-blue-700 dark:text-blue-300">File Upload</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <CardDescription className="dark:text-gray-300">
                  Unggah File ZIP, Gambar, atau Apa Saja Langsung ke Repositori GitHub-mu.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 max-w-xs mx-auto w-full">
              <CardHeader className="px-5 pt-5 pb-2">
                <CardTitle className="text-purple-700 dark:text-purple-300">README Editor</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
             <CardDescription className="dark:text-gray-300">Bikin & Edit README.md Lebih Mudah dengan Editor Markdown Powerful.</CardDescription>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 max-w-xs mx-auto w-full">
              <CardHeader className="px-5 pt-5 pb-2">
                <CardTitle className="text-green-700 dark:text-green-300">Repo Creation</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
           <CardDescription className="dark:text-gray-300">Buat Repo Baru Sesuai Gaya Kamu — Atur Privasi & Cabang Sesuka Hati</CardDescription>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 max-w-xs mx-auto w-full">
              <CardHeader className="px-5 pt-5 pb-2">
                <CardTitle className="text-red-700 dark:text-red-300">Repo Management</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <CardDescription className="dark:text-gray-300">Delete repositories with a simple checkbox interface</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <footer className="border-t bg-white dark:bg-black dark:border-gray-800 py-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Github className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">GitPush</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Platform modern untuk mengelola repositori GitHub dengan mudah dan efisien.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/learn-more" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                    Learn More
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Connect</h3>
              <div className="flex space-x-4">
                <a href="https://github.com/Rektzhome" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                  <Github className="h-5 w-5" />
                  <span className="sr-only">GitHub</span>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} GitPush. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 md:mt-0">
              Credit by Rektzhome
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
