"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
    { href: "/#live-tv", label: "Live TV" },
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#about", label: "About" },
    { href: "/#contact", label: "Contact" },
];

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        if (!isMenuOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsMenuOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isMenuOpen]);

    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur-lg">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between gap-6 md:h-20">
                    <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex shrink-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary" aria-label="Spark Exchange home">
                        <Image src="/favicon.jpg" alt="" width={40} height={40} className="rounded-xl" />
                        <span className="text-base font-bold tracking-tight sm:text-lg">Spark Exchange</span>
                    </Link>

                    <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
                        {navigation.map(item => (
                            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-3 text-sm font-medium text-foreground/75 transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{item.label}</Link>
                        ))}
                        <a href="https://plasmax.io/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg px-3 py-3 text-sm font-medium text-foreground/75 transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Plasmax <ArrowUpRight size={15} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
                    </nav>

                    <div className="hidden lg:block">
                        <Button variant="gradient" size="lg" asChild><Link href="/#exchange">Start Exchange</Link></Button>
                    </div>
                    <button type="button" className="flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden" aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={isMenuOpen} aria-controls="mobile-navigation" onClick={() => setIsMenuOpen(open => !open)}>
                        {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
                    </button>
                </div>
            </div>
            {isMenuOpen && (
                <nav id="mobile-navigation" aria-label="Mobile navigation" className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-border bg-background px-4 pb-6 pt-2 shadow-xl lg:hidden">
                    <div className="container mx-auto flex flex-col">
                        {navigation.map(item => (
                            <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} className="rounded-lg px-3 py-3 text-base font-medium text-foreground/85 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary">{item.label}</Link>
                        ))}
                        <a href="https://plasmax.io/" target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-1 rounded-lg px-3 py-3 text-base font-medium text-foreground/85 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary">Plasmax <ArrowUpRight size={16} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
                        <Button variant="gradient" size="lg" className="mt-3" asChild><Link href="/#exchange" onClick={() => setIsMenuOpen(false)}>Start Exchange</Link></Button>
                        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-5 text-sm text-muted-foreground">
                            <Link href="/privacy-policy" onClick={() => setIsMenuOpen(false)} className="hover:text-foreground">Privacy Policy</Link>
                            <Link href="/terms-and-conditions" onClick={() => setIsMenuOpen(false)} className="hover:text-foreground">Terms &amp; Conditions</Link>
                        </div>
                    </div>
                </nav>
            )}
        </header>
    );
}

