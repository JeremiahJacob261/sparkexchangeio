"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <Image
                            src="/favicon.jpg"
                            alt="Spark Exchange Logo"
                            width={40}
                            height={40}
                            className="rounded-xl shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all duration-300"
                        />
                        <span className="text-xl font-bold gradient-text hidden sm:block">
                            Spark Exchange
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link
                            href="/"
                            className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                        >
                            Home
                        </Link>
                        <Link
                            href="#how-it-works"
                            className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                        >
                            How it works
                        </Link>
                        <Link
                            href="#about"
                            className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                        >
                            About us
                        </Link>
                        <Link
                            href="#contact"
                            className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                        >
                            Contact
                        </Link>
                    </nav>

                    {/* CTA Button */}
                    <div className="hidden md:block">
                        <Button variant="gradient" size="lg" asChild>
                            <Link href="#exchange">Start Exchange</Link>
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? (
                            <X className="w-6 h-6" />
                        ) : (
                            <Menu className="w-6 h-6" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border/50">
                    <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
                        <Link
                            href="/"
                            className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors py-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Home
                        </Link>
                        <Link
                            href="#how-it-works"
                            className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors py-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            How it works
                        </Link>
                        <Link
                            href="#about"
                            className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors py-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            About us
                        </Link>
                        <Link
                            href="#contact"
                            className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors py-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Contact
                        </Link>
                        <Button variant="gradient" size="lg" className="mt-2" asChild>
                            <Link href="#exchange" onClick={() => setIsMenuOpen(false)}>
                                Start Exchange
                            </Link>
                        </Button>
                    </nav>
                </div>
            )}
        </header>
    );
}
