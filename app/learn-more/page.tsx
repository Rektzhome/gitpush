"use client"

import Link from "next/link"
import { Github, ArrowLeft, BookOpen, Code, FileUp, GitBranch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LearnMorePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-black dark:to-gray-900">
      <header className="container mx-auto px-6 flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <Github className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">GitPush</h1>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
            Home
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
            Dashboard
          </Link>
          <ThemeToggle />
          <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700 px-5">
            <Link href="/auth">Ayo Mulai</Link>
          </Button>
        </nav>
      </header>
      
      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Beranda
          </Link>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl mb-4">
              Tentang GitPush
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Platform modern untuk mengelola repositori GitHub dengan mudah dan efisien
            </p>
          </div>
          
          <div className="space-y-12">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Apa itu GitPush?</h2>
              <p className="text-gray-600 dark:text-gray-300">
                GitPush adalah platform yang dirancang untuk menyederhanakan pengelolaan repositori GitHub Anda. 
                Dengan antarmuka yang intuitif dan modern, GitPush memungkinkan Anda untuk mengunggah file, 
                membuat README, mengelola repositori, dan banyak lagi tanpa perlu menggunakan command line.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Platform ini dibuat untuk developer, content creator, dan siapa saja yang menggunakan GitHub 
                namun menginginkan cara yang lebih mudah untuk mengelola repositori mereka.
              </p>
            </section>
            
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cara Penggunaan</h2>
              
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border dark:border-gray-700 dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Unggah File
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="dark:text-gray-300">
                      <ol className="list-decimal list-inside space-y-2">
                        <li>Login dengan akun GitHub Anda</li>
                        <li>Pilih repositori tujuan dari dropdown</li>
                        <li>Pilih branch (main/master)</li>
                        <li>Unggah file atau folder ZIP (akan diekstrak otomatis)</li>
                        <li>File akan langsung tersedia di repositori GitHub Anda</li>
                      </ol>
                    </CardDescription>
                  </CardContent>
                </Card>
                
                <Card className="border dark:border-gray-700 dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      Edit README
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="dark:text-gray-300">
                      <ol className="list-decimal list-inside space-y-2">
                        <li>Pilih repositori dari daftar</li>
                        <li>Gunakan editor markdown yang intuitif</li>
                        <li>Pratinjau perubahan secara real-time</li>
                        <li>Simpan perubahan langsung ke repositori</li>
                        <li>Tambahkan gambar dan format teks dengan mudah</li>
                      </ol>
                    </CardDescription>
                  </CardContent>
                </Card>
                
                <Card className="border dark:border-gray-700 dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5 text-green-600 dark:text-green-400" />
                      Buat Repositori
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="dark:text-gray-300">
                      <ol className="list-decimal list-inside space-y-2">
                        <li>Klik tombol "Buat Repositori"</li>
                        <li>Masukkan nama dan deskripsi repositori</li>
                        <li>Pilih visibilitas (publik/privat)</li>
                        <li>Tambahkan file README jika diperlukan</li>
                        <li>Repositori baru akan langsung tersedia</li>
                      </ol>
                    </CardDescription>
                  </CardContent>
                </Card>
                
                <Card className="border dark:border-gray-700 dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitBranch className="h-5 w-5 text-red-600 dark:text-red-400" />
                      Kelola Repositori
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="dark:text-gray-300">
                      <ol className="list-decimal list-inside space-y-2">
                        <li>Lihat semua repositori dalam satu tampilan</li>
                        <li>Pilih repositori yang ingin dihapus</li>
                        <li>Konfirmasi penghapusan untuk keamanan</li>
                        <li>Repositori akan dihapus dari akun GitHub Anda</li>
                        <li>Daftar repositori akan diperbarui secara otomatis</li>
                      </ol>
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Keunggulan GitPush</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Antarmuka modern dan intuitif yang mudah digunakan</li>
                <li>Ekstraksi otomatis file ZIP saat diunggah ke repositori</li>
                <li>Editor README dengan pratinjau real-time</li>
                <li>Pengelolaan repositori yang efisien dan cepat</li>
                <li>Dukungan dark mode untuk kenyamanan pengguna</li>
                <li>Tidak perlu menggunakan command line Git</li>
              </ul>
            </section>
            
            <div className="text-center pt-8">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 px-8">
                <Link href="/auth">Mulai Sekarang</Link>
              </Button>
            </div>
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
